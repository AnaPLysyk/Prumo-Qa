import { z } from 'zod';
import { listarTrabalhos, type Trabalho } from './fila.js';
import { listarRotinas, proximoSlot, type Rotina } from './agenda.js';
import { listarEspacos, type Espaco } from './espacos.js';

/**
 * Histórico centralizado (2.8): une os trabalhos da fila (execuções, consultas, horários perdidos) com rotina, projeto,
 * ticket e repositório vinculado. Consulta apenas dados locais já registrados; nada é recalculado nem inventado.
 * Métricas contam EXECUÇÕES de QA reais (PASS/FAIL/BLOCKED/NOT_RUN). Consultas (INFO) e horários perdidos ficam à parte,
 * e abrir a interface nunca conta como execução.
 */
export const filtroExecucoes = z.object({
  espacoId: z.string().uuid().optional(), rotinaId: z.string().uuid().optional(), ticket: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(),
  repositorio: z.string().max(200).optional(), estado: z.enum(['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO']).optional(),
  resultado: z.enum(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO']).optional(),
  since: z.string().datetime().optional(), until: z.string().datetime().optional(), limite: z.number().int().min(1).max(500).default(100)
}).strict();
export type FiltroExecucoes = z.input<typeof filtroExecucoes>;

const duracao = (t: Trabalho) => t.iniciadoEm && t.terminadoEm ? Math.max(0, Date.parse(t.terminadoEm) - Date.parse(t.iniciadoEm)) : null;
const repoDe = (e: Espaco | undefined) => e?.vinculos.find(v => v.servico === 'github')?.recurso.chave ?? null;

export function listarExecucoes(f: FiltroExecucoes = {}, base?: string) {
  const q = filtroExecucoes.parse(f); const rotinas = new Map(listarRotinas(base).map(r => [r.id, r])); const espacos = new Map(listarEspacos(base).map(e => [e.id, e]));
  const itens = listarTrabalhos(base).filter(t =>
    (!q.espacoId || t.espacoId === q.espacoId) && (!q.rotinaId || t.rotinaId === q.rotinaId) && (!q.ticket || t.ticket === q.ticket) && (!q.estado || t.estado === q.estado)
    && (!q.resultado || t.resultado?.status === q.resultado) && (!q.since || t.criadoEm >= q.since) && (!q.until || t.criadoEm <= q.until) && (!q.repositorio || repoDe(espacos.get(t.espacoId)) === q.repositorio));
  const ordenados = itens.sort((a, b) => (b.slot ?? b.criadoEm).localeCompare(a.slot ?? a.criadoEm));
  return { total: ordenados.length, execucoes: ordenados.slice(0, q.limite).map(t => {
    const r = rotinas.get(t.rotinaId); const e = espacos.get(t.espacoId);
    return { id: t.id, rotinaId: t.rotinaId, rotina: r?.nome ?? '(rotina excluída)', espacoId: t.espacoId, projeto: e?.nome ?? '(projeto removido)', repositorio: repoDe(e), tipo: t.tipo, capability: t.capability ?? null, ambiente: t.ambiente, ticket: t.ticket ?? null,
      executor: t.origem === 'AGENDA' ? 'Prumo (agenda)' : 'Prumo (manual)', origem: t.origem, slot: t.slot, criadoEm: t.criadoEm, inicio: t.iniciadoEm, termino: t.terminadoEm, duracaoMs: duracao(t), estado: t.estado,
      resultado: t.resultado, tentativas: t.log.map(x => ({ n: x.n, inicio: x.inicio, fim: x.fim, estado: x.estado, codigo: x.codigo ?? null })), erro: t.erro, jira: t.jira, evidenciaId: t.resultado?.evidenciaId ?? null, pastaLocal: e?.pastaLocal ?? null };
  }) };
}

export function metricas(espacoId?: string, base?: string, agora = new Date()) {
  const trabalhos = listarTrabalhos(base).filter(t => !espacoId || t.espacoId === espacoId); const rotinas = listarRotinas(base).filter(r => !espacoId || r.espacoId === espacoId);
  const reais = trabalhos.filter(t => t.estado === 'CONCLUIDO' && t.resultado && ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(t.resultado.status));
  const n = (s: string) => reais.filter(t => t.resultado!.status === s).length;
  const ultima = [...trabalhos].filter(t => t.terminadoEm && t.estado !== 'PERDIDO').sort((a, b) => b.terminadoEm!.localeCompare(a.terminadoEm!))[0];
  const proximas = rotinas.filter((r: Rotina) => r.estado === 'ATIVA').map(r => proximoSlot(r, agora.getTime())).filter((x): x is number => x !== null);
  return {
    escopo: espacoId ?? 'todos', execucoes: reais.length, pass: n('PASS'), fail: n('FAIL'), blocked: n('BLOCKED'), notRun: n('NOT_RUN'),
    consultas: trabalhos.filter(t => t.resultado?.status === 'INFO').length,
    ultimaExecucao: ultima ? { id: ultima.id, em: ultima.terminadoEm, resultado: ultima.resultado?.status ?? ultima.estado } : null,
    proximaExecucao: proximas.length ? new Date(Math.min(...proximas)).toISOString() : null,
    rotinasAtivas: rotinas.filter(r => r.estado === 'ATIVA').length, rotinasPausadas: rotinas.filter(r => r.estado === 'PAUSADA').length,
    falhasDeAgendamento: trabalhos.filter(t => t.estado === 'ERRO' || t.estado === 'PERDIDO').length,
    comentariosPendentes: trabalhos.filter(t => t.jira.estado === 'PENDENTE' || t.jira.estado === 'FALHA' || t.jira.estado === 'PREPARADO').length,
    publicacoesConcluidas: trabalhos.filter(t => t.jira.estado === 'PUBLICADO').length,
    aviso: 'Contagens vêm das execuções registradas. Não há porcentagem de qualidade: quantidade de testes não mede qualidade.'
  };
}
