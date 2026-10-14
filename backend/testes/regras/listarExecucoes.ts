/** Lista o histórico de execuções por projeto, repositório, ticket, rotina, estado e período. */
import { listarRotinas } from '../../agendamentos/banco/listarRotinas.js';
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { duracaoDoTrabalho } from './duracaoDoTrabalho.js';
import { repositorioDoEspaco } from './repositorioDoEspaco.js';
import { FiltroExecucoes, filtroExecucoes } from '../tipos/historicoDeExecucoes.js';
import { listarEspacos } from '../../projetos/banco/listarEspacos.js';

export function listarExecucoes(f: FiltroExecucoes = {}, base?: string) {
  const q = filtroExecucoes.parse(f); const rotinas = new Map(listarRotinas(base).map(r => [r.id, r])); const espacos = new Map(listarEspacos(base).map(e => [e.id, e]));
  const itens = listarTrabalhos(base).filter(t =>
    (!q.espacoId || t.espacoId === q.espacoId) && (!q.rotinaId || t.rotinaId === q.rotinaId) && (!q.ticket || t.ticket === q.ticket) && (!q.estado || t.estado === q.estado)
    && (!q.resultado || t.resultado?.status === q.resultado) && (!q.since || t.criadoEm >= q.since) && (!q.until || t.criadoEm <= q.until) && (!q.repositorio || repositorioDoEspaco(espacos.get(t.espacoId)) === q.repositorio));
  const ordenados = itens.sort((a, b) => (b.slot ?? b.criadoEm).localeCompare(a.slot ?? a.criadoEm));
  return { total: ordenados.length, execucoes: ordenados.slice(0, q.limite).map(t => {
    const r = rotinas.get(t.rotinaId); const e = espacos.get(t.espacoId);
    return { id: t.id, rotinaId: t.rotinaId, rotina: r?.nome ?? '(rotina excluída)', espacoId: t.espacoId, projeto: e?.nome ?? '(projeto removido)', repositorio: repositorioDoEspaco(e), tipo: t.tipo, capability: t.capability ?? null, ambiente: t.ambiente, ticket: t.ticket ?? null,
      executor: t.origem === 'AGENDA' ? 'Prumo (agenda)' : 'Prumo (manual)', origem: t.origem, slot: t.slot, criadoEm: t.criadoEm, inicio: t.iniciadoEm, termino: t.terminadoEm, duracaoMs: duracaoDoTrabalho(t), estado: t.estado,
      resultado: t.resultado, tentativas: t.log.map(x => ({ n: x.n, inicio: x.inicio, fim: x.fim, estado: x.estado, codigo: x.codigo ?? null })), erro: t.erro, jira: t.jira, evidenciaId: t.resultado?.evidenciaId ?? null, pastaLocal: e?.pastaLocal ?? null };
  }) };
}
