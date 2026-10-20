/** Prévia em memória e importação confirmada de projetos Qase; nunca entrega credenciais ao renderer. */
import { randomUUID } from 'node:crypto';
import { AdaptadorServico } from '../integracoes/AdaptadorServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { instanciaServico } from '../integracoes/instanciaServico.js';
import { Recurso } from '../../projetos/contratos.js';
import { lerContasDeServico } from '../banco/contasDeServico.js';
import { lerEspacos } from '../../projetos/repositorio.js';
import { adicionarConta } from './adicionarConta.js';
import { criarEspaco } from '../../projetos/servicoProjetos.js';
import { vincularServicoAoEspaco } from '../../projetos/servicoProjetos.js';

type Previa = { token: string; projetos: Recurso[]; expiraEm: number; timer: ReturnType<typeof setTimeout> };
const LIMITE_PROJETOS = 1000, PRAZO_MS = 5 * 60_000;
const erroSeguro = (e: unknown) => {
  const valor = e instanceof Error ? e.message : '';
  return /^[A-Z][A-Z0-9_]{2,70}$/.test(valor) ? valor : 'QASE_IMPORT_FAILED';
};

export function importarProjetosQase(c: ContextoDosServicos) {
  const previas = new Map<string, Previa>();
  const projetosImportados = (conexaoId: string) => lerEspacos(c.base).espacos.flatMap(e => e.vinculos
    .filter(v => v.servico === 'qase' && v.conexaoId === conexaoId && v.recurso.instancia === instanciaServico('qase'))
    .map(v => ({ codigo: v.recurso.chave, espacoId: e.id })));

  function limpar(id: string) {
    const item = previas.get(id);
    if (item) clearTimeout(item.timer);
    previas.delete(id);
  }
  async function buscarProjetos(token: string): Promise<Recurso[]> {
    const adaptador = new AdaptadorServico({
      id: randomUUID(), servico: 'qase', instancia: instanciaServico('qase'),
      contaId: 'previa-local', token
    }, c.transporte, c.escrita);
    await adaptador.autenticar();
    const todos: Recurso[] = [], vistos = new Set<string>();
    let offset = 0;
    while (offset < LIMITE_PROJETOS) {
      const pagina = await adaptador.listar({ offset, limite: 100 });
      if (pagina.total !== undefined && pagina.total > LIMITE_PROJETOS)
        throw new Error('QASE_PROJECT_LIMIT');
      if (!pagina.recursos.length) {
        if (pagina.proxima !== null) throw new Error('SERVICE_RESPONSE_INVALID');
        return todos;
      }
      for (const projeto of pagina.recursos) {
        if (vistos.has(projeto.chave)) throw new Error('SERVICE_RESPONSE_INVALID');
        vistos.add(projeto.chave);
        todos.push(projeto);
      }
      if (pagina.proxima === null) return todos;
      if (pagina.proxima <= offset || pagina.proxima !== offset + pagina.recursos.length)
        throw new Error('SERVICE_RESPONSE_INVALID');
      offset = pagina.proxima;
    }
    throw new Error('QASE_PROJECT_LIMIT');
  }
  async function prever(token: string) {
    if (!c.protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
    if (!token || token.length > 6000 || /[\x00-\x1f]/.test(token)) throw new Error('INVALID_ARGUMENTS');
    const projetos = await buscarProjetos(token);
    for (const idAnterior of previas.keys()) limpar(idAnterior);
    const id = randomUUID();
    const timer = setTimeout(() => limpar(id), PRAZO_MS);
    timer.unref?.();
    previas.set(id, { token, projetos, expiraEm: Date.now() + PRAZO_MS, timer });
    const contaExistente = lerContasDeServico(c.base).contas.find(x => x.ativa && x.servico === 'qase' && (()=>{try{return c.cofre.ler(x.id)===token;}catch{return false;}})());
    const usados = new Set(contaExistente ? projetosImportados(contaExistente.id).map(x => x.codigo) : []);
    const todos = lerEspacos(c.base).espacos.flatMap(e => e.vinculos.filter(v => v.servico === 'qase' && v.recurso.instancia === instanciaServico('qase')));
    const conflitantes = new Set(todos.filter(v => v.conexaoId !== contaExistente?.id).map(v => v.recurso.chave));
    return { previaId: id, projetos: projetos.map(p => ({
      codigo: p.chave, nome: p.nome, jaImportado: usados.has(p.chave), conflitoOutraConta: conflitantes.has(p.chave)
    })) };
  }
  async function importar(previaId: string, codigos: string[]) {
    const previa = previas.get(previaId);
    if (!previa || Date.now() > previa.expiraEm) {
      limpar(previaId);
      throw new Error('QASE_PREVIEW_EXPIRED');
    }
    if (!codigos.length || codigos.length > LIMITE_PROJETOS || new Set(codigos).size !== codigos.length ||
        codigos.some(codigo => !previa.projetos.some(p => p.chave === codigo)))
      throw new Error('INVALID_ARGUMENTS');
    // A prévia não é identidade suficiente: reconfere todos os projetos antes da primeira gravação.
    const atuais = await buscarProjetos(previa.token);
    for (const codigo of codigos) {
      const anterior = previa.projetos.find(p => p.chave === codigo)!;
      const atual = atuais.find(p => p.chave === codigo);
      if (!atual || atual.id !== anterior.id || atual.instancia !== anterior.instancia)
        throw new Error('SERVICE_SCOPE_CHANGED');
    }
    const contas = lerContasDeServico(c.base).contas.filter(x => x.ativa && x.servico === 'qase');
    let conta = contas.find(x => {
      try { return c.cofre.ler(x.id) === previa.token; } catch { return false; }
    });
    if (!conta) conta = await adicionarConta(c, { servico: 'qase', nome: 'Qase', token: previa.token });
    // A credencial agora está no cofre. Descarte imediatamente a cópia temporária.
    limpar(previaId);
    const resultado = { adicionados: [] as string[], existentes: [] as string[],
      falhas: [] as { codigo: string; erro: string }[], contaId: conta.id };
    for (const codigo of codigos) {
      try {
        if (projetosImportados(conta.id).some(x => x.codigo === codigo)) {
          resultado.existentes.push(codigo);
          continue;
        }
        // Qase API v1 não fornece uma identidade global estável da conta. O mesmo código em outra conexão é ambíguo.
        if (lerEspacos(c.base).espacos.some(e => e.vinculos.some(v => v.servico === 'qase' && v.conexaoId !== conta.id && v.recurso.instancia === instanciaServico('qase') && v.recurso.chave === codigo)))
          throw new Error('QASE_PROJECT_AMBIGUOUS');
        if (lerEspacos(c.base).espacos.length >= 200) throw new Error('WORKSPACE_LIMIT');
        // O ID da conta/instância revalidado é o único que pode ser persistido.
        const recurso = await new AdaptadorServico({
          ...conta, token: c.cofre.ler(conta.id)
        }, c.transporte, c.escrita).obterRecurso(codigo);
        const espaco = await criarEspaco({ nome: recurso.nome, descricao: '' }, c.base);
        try {
          vincularServicoAoEspaco(espaco.id, 'qase', conta.id, recurso, c.base);
          resultado.adicionados.push(codigo);
        } catch (e) {
          resultado.falhas.push({ codigo, erro: erroSeguro(e) });
        }
      } catch (e) {
        resultado.falhas.push({ codigo, erro: erroSeguro(e) });
      }
    }
    return resultado;
  }
  async function preverConta(conexaoId: string) {
    const conta = lerContasDeServico(c.base).contas.find(x => x.id === conexaoId && x.ativa && x.servico === 'qase');
    if (!conta) throw new Error('SERVICE_NOT_FOUND');
    return prever(c.cofre.ler(conta.id));
  }
  return { prever, preverConta, importar, cancelar: (previaId: string) => { limpar(previaId); return { cancelada: true }; },
    limparTodas: () => { for (const id of previas.keys()) limpar(id); } };
}
