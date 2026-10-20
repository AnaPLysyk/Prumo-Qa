/** Monta o resumo de cada contexto para a lista, apontando conflitos (mesma chave ou marcados pela pessoa) e alterações suspeitas. */

import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';
import { Arquivo, Estado, Resumo , ehInstrucao } from '../tipos/contexto.js';

const suspeitaDeInstrucao = (texto: string) => ehInstrucao.test(texto);

/** Estado efetivo: DESATUALIZADO prevalece; depois conflito (marcado ou derivado da mesma chave); senão o registrado. */
export function resumirContextos(itens: { arq: Arquivo; integro: boolean }[]): Resumo[] {
  const vivos = itens.filter(i => ultimaVersaoDoContexto(i.arq).estado !== 'DESATUALIZADO');
  const porChave = new Map<string, string[]>(); for (const i of vivos) { const k = ultimaVersaoDoContexto(i.arq).conteudo.chave; if (k) porChave.set(k, [...(porChave.get(k) ?? []), i.arq.id]); }
  const manuais = new Map<string, Set<string>>(); for (const i of vivos) for (const e of i.arq.historico) if (e.acao === 'conflito' && e.detalhe?.outroId) { (manuais.get(i.arq.id) ?? manuais.set(i.arq.id, new Set()).get(i.arq.id)!).add(e.detalhe.outroId); (manuais.get(e.detalhe.outroId) ?? manuais.set(e.detalhe.outroId, new Set()).get(e.detalhe.outroId)!).add(i.arq.id); }
  const resolvidos = new Set(vivos.filter(i => ultimaVersaoDoContexto(i.arq).acao === 'conflito_resolvido').map(i => i.arq.id));
  const aprovadoEm = (a: Arquivo) => [...a.historico].reverse().find(e => e.acao === 'aprovado' && e.conteudoHash === ultimaVersaoDoContexto(a).conteudoHash);
  return itens.map(({ arq, integro }) => {
    const u = ultimaVersaoDoContexto(arq); const c = u.conteudo; const vivo = u.estado !== 'DESATUALIZADO';
    const derivado = vivo && c.chave ? (porChave.get(c.chave) ?? []).filter(x => x !== arq.id) : [];
    const marcados = vivo && !resolvidos.has(arq.id) ? [...(manuais.get(arq.id) ?? [])].filter(x => vivos.some(v => v.arq.id === x)) : [];
    const conflita = [...new Set([...derivado, ...marcados])];
    const estado: Estado = !vivo ? 'DESATUALIZADO' : conflita.length ? 'CONFLITANTE' : u.estado === 'CONFLITANTE' ? 'RASCUNHO' : u.estado;
    const ap = u.estado === 'APROVADO' ? aprovadoEm(arq) : undefined;
    return { id: arq.id, tipo: c.tipo, titulo: c.titulo, chave: c.chave ?? null, estado, estadoRegistrado: u.estado, versao: u.versao, atualizadoEm: u.em, origem: c.origem, hash: u.conteudoHash, conflitaCom: conflita, integridade: integro ? 'OK' : 'ADULTERADO',
      aprovadoPor: ap?.por ?? null, aprovadoEm: ap?.em ?? null, substitui: arq.substitui ?? null, alertaDeInstrucao: suspeitaDeInstrucao(c.texto) };
  });
}
