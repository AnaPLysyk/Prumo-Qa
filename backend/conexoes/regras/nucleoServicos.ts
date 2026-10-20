/** Núcleo das conexões e fachada de aplicação — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { cofreCredenciais } from "../banco/credenciais.js";
import { listarContas, lerContasDeServico, gravarContasDeServico } from "../banco/contasDeServico.js";
import { enviarAoServico, lerDoServico } from "../integracoes/requisicoes.js";
import { ContextoServico, OperacaoServico } from "../tipos/adaptador.js";
import { ContextoDosServicos, conexaoEntrada } from "../tipos/contaDeServico.js";
import { Protetor } from "../tipos/transporte.js";
import { Filtros } from "../tipos/adaptador.js";
import { TransporteEscrita, TransporteServico, paginaSchema } from "../tipos/transporte.js";
import { Recurso, Servico } from "../../projetos/contratos.js";
import { adicionarConta, adaptadorDaConta, contaAtiva, verificarVinculoDoServico, codigoDoErroDeServico, vinculoDoServico } from "../servicoContas.js";
import { importarProjetosQase } from "./importarProjetosQase.js";
import { obterEspaco, listarEspacos } from "../../projetos/banco/projetos.js";
import { vincularServicoAoEspaco, atualizarEstadoDoVinculo, registrarConsultaExterna, configurarAceite } from "../../projetos/servicoProjetos.js";
import { ErroServico } from "../integracoes/ErroServico.js";
import { safeStorage } from "electron";
import { protetorDoSistema } from "./protetorDoSistema.js";

// ── nucleoServicos ──
async function comentarNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, adf: unknown) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, 'jira');
    const r = await v.adaptador.publicarComentario(v.recurso, ticket, adf);
    registrarConsultaExterna(espacoId, 'jira', 'COMMENT_OK', c.base);
    const vi = vinculoDoServico(c, espacoId, 'jira');
    return { ...r, vinculoId: vi.id, conexaoId: vi.conexaoId };
  } catch (e) { registrarConsultaExterna(espacoId, 'jira', codigoDoErroDeServico(e), c.base); throw e; }
}

async function consultarServico(c: ContextoDosServicos, espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, servico);
    const r = await v.adaptador.consultar(v.recurso, operacao, pagina, id, v.campoAceite, filtros);
    registrarConsultaExterna(espacoId, servico, 'OK', c.base); return r;
  } catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}

async function escolherCampoAceite(c: ContextoDosServicos, espacoId: string, campo: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira'); const r = await v.adaptador.consultar(v.recurso, 'campos');
  if (!Array.isArray(r.dados) || !r.dados.some(x => x.id === campo && x.custom === true)) throw new Error('JIRA_FIELD_NOT_AVAILABLE');
  return configurarAceite(espacoId, campo, c.base);
}

async function executarComServico<T>(c: ContextoDosServicos, espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>): Promise<T> {
  const v = await verificarVinculoDoServico(c, espacoId, servico); const vi = vinculoDoServico(c, espacoId, servico);
  try { return await fn(v.adaptador.contexto(), v.recurso, { vinculoId: vi.id, conexaoId: vi.conexaoId }); }
  catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}

async function listarRecursosDaConta(c: ContextoDosServicos, id: string, pagina: z.input<typeof paginaSchema> = {}) {
  return adaptadorDaConta(c, contaAtiva(c, id)).listar(pagina);
}

async function procurarComentarioNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, marcador: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira');
  return v.adaptador.procurarComentario(v.recurso, ticket, marcador);
}

function removerConta(c: ContextoDosServicos, id: string) {
  const r = lerContasDeServico(c.base); const conta = r.contas.find(x => x.id === id); if (!conta) throw new Error('CONNECTION_NOT_FOUND');
  conta.ativa = false; gravarContasDeServico(r, c.base); c.cofre.remover(id);
  for (const e of listarEspacos(c.base)) for (const v of e.vinculos) if (v.conexaoId === id) atualizarEstadoDoVinculo(e.id, v.servico, 'SEM_CREDENCIAL', 'CREDENTIAL_UNAVAILABLE', undefined, c.base);
  return { removida: true };
}

async function validarConta(c: ContextoDosServicos, id: string) {
  const conta = contaAtiva(c, id); const atual = await adaptadorDaConta(c, conta).autenticar();
  if (atual.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const r = lerContasDeServico(c.base); r.contas.find(x => x.id === id)!.validadaEm = new Date().toISOString(); gravarContasDeServico(r, c.base);
  return contaAtiva(c, id);
}

async function validarVinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico) {
  await verificarVinculoDoServico(c, espacoId, servico, true);
  return obterEspaco(espacoId, c.base);
}

async function vincularRecursoAoEspaco(c: ContextoDosServicos, espacoId: string, conexaoId: string, recurso: Recurso) {
  obterEspaco(espacoId, c.base); const conta = contaAtiva(c, conexaoId);
  const atual = await adaptadorDaConta(c, conta).obterRecurso(recurso.id);
  if (JSON.stringify(atual) !== JSON.stringify(recurso)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return vincularServicoAoEspaco(espacoId, conta.servico, conta.id, atual, c.base);
}

/** Dependências só do processo principal. Testes fornecem doubles; nenhum toggle em produção. Cada ação fica no seu arquivo. */
export function nucleoServicos(protetor: Protetor, transporte: TransporteServico = lerDoServico, base?: string, escrita: TransporteEscrita = enviarAoServico) {
  const c: ContextoDosServicos = { protetor, transporte, escrita, base, cofre: cofreCredenciais(protetor, base) };
  const importacaoQase = importarProjetosQase(c);
  return {
    contas: () => listarContas(base),
    qasePrever: (token: string) => importacaoQase.prever(token),
    qasePreverConta: (conexaoId: string) => importacaoQase.preverConta(conexaoId),
    qaseImportar: (previaId: string, codigos: string[]) => importacaoQase.importar(previaId, codigos),
    qaseCancelar: (previaId: string) => importacaoQase.cancelar(previaId),
    limparPrevias: () => importacaoQase.limparTodas(),
    adicionar: (entrada: z.input<typeof conexaoEntrada>) => adicionarConta(c, entrada),
    validarConta: (id: string) => validarConta(c, id),
    removerConta: (id: string) => removerConta(c, id),
    listar: (id: string, pagina: z.input<typeof paginaSchema> = {}) => listarRecursosDaConta(c, id, pagina),
    vincular: (espacoId: string, conexaoId: string, recurso: Recurso) => vincularRecursoAoEspaco(c, espacoId, conexaoId, recurso),
    validarVinculo: (espacoId: string, servico: Servico) => validarVinculoDoServico(c, espacoId, servico),
    consultar: (espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) => consultarServico(c, espacoId, servico, operacao, pagina, id, filtros),
    comContexto: <T>(espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>) => executarComServico(c, espacoId, servico, fn),
    comentarJira: (espacoId: string, ticket: string, adf: unknown) => comentarNoJira(c, espacoId, ticket, adf),
    procurarComentarioJira: (espacoId: string, ticket: string, marcador: string) => procurarComentarioNoJira(c, espacoId, ticket, marcador),
    campoAceite: (espacoId: string, campo: string) => escolherCampoAceite(c, espacoId, campo),
  };
}

// ── servicosDoAplicativo ──
export const servicosDoAplicativo=nucleoServicos(protetorDoSistema(safeStorage));
