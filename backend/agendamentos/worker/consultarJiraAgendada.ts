/** Rotina "consulta Jira": lê até 50 tickets e informa quais são novos ou mudaram desde a consulta anterior; não executa nada. */
import { gravarEstadoDasRotinas } from '../banco/gravarEstadoDasRotinas.js';
import { lerEstadoDasRotinas } from '../banco/lerEstadoDasRotinas.js';
import { ResultadoTrabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';

export async function consultarJiraAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
  if (!e.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
  const res = await e.d.servicos.consultar(r.espacoId, 'jira', r.operacaoJira, { limite: 50 }, r.ticket);
  const lista = (Array.isArray(res.dados) ? res.dados : [res.dados]) as Record<string, unknown>[]; const atual: Record<string, string> = {};
  for (const i of lista.slice(0, 50)) { const f = (i.fields ?? {}) as Record<string, unknown>; if (typeof i.key === 'string') atual[i.key] = String(f.updated ?? ''); }
  const est = lerEstadoDasRotinas(e.base); const antes = est.itens[r.id]?.jira;
  const alterados = antes ? Object.keys(atual).filter(k => antes[k] !== atual[k]) : [];
  est.itens[r.id] = { ...est.itens[r.id], jira: atual }; gravarEstadoDasRotinas(est, e.base);
  return { status: 'INFO', motivo: antes ? `${Object.keys(atual).length} ticket(s) consultado(s); ${alterados.length} novo(s) ou alterado(s) desde a última consulta.` : `${Object.keys(atual).length} ticket(s) consultado(s); primeira consulta serve de referência.`, detalhes: alterados.slice(0, 20).join('\n') || undefined, ticket: r.ticket };
}
