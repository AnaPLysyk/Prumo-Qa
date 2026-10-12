/** Rotina "análise de mudanças": lê os commits do repositório vinculado e diz quantos são novos desde a última análise; nunca dispara testes sozinha. */
import { gravarEstadoDasRotinas } from '../banco/gravarEstadoDasRotinas.js';
import { lerEstadoDasRotinas } from '../banco/lerEstadoDasRotinas.js';
import { ResultadoTrabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';

export async function analisarMudancasAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
  if (!e.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
  const res = await e.d.servicos.consultar(r.espacoId, 'github', 'commits', { limite: 30 });
  const commits = (Array.isArray(res.dados) ? res.dados : []) as { sha?: string; commit?: { message?: string } }[];
  const est = lerEstadoDasRotinas(e.base); const visto = est.itens[r.id]?.github; const shas = commits.map(c => String(c.sha ?? '')).filter(s => /^[a-f0-9]{40}$/.test(s));
  if (!shas.length) return { status: 'INFO', motivo: 'Nenhum commit retornado pelo repositório vinculado.' };
  est.itens[r.id] = { ...est.itens[r.id], github: shas[0] }; gravarEstadoDasRotinas(est, e.base);
  if (!visto) return { status: 'INFO', motivo: `Primeira análise: referência registrada em ${shas[0]!.slice(0, 7)}. Nenhuma execução foi disparada.` };
  const novos = shas.indexOf(visto) < 0 ? shas.length : shas.indexOf(visto);
  return { status: 'INFO', motivo: novos ? `${novos}${shas.indexOf(visto) < 0 ? '+' : ''} commit(s) novo(s) desde ${visto.slice(0, 7)}. Considere executar a regressão; o Prumo não a disparou automaticamente.` : 'Sem commits novos desde a última análise.',
    detalhes: commits.slice(0, novos).map(c => `${String(c.sha).slice(0, 7)} ${String(c.commit?.message ?? '').split('\n')[0]}`.slice(0, 200)).join('\n') || undefined };
}
