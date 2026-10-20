/** Escolhe o que fazer conforme o tipo da rotina (smoke, regressão, validação por ticket, k6, run do Qase, consulta Jira ou análise de mudanças) e devolve o resultado. */
import { executarValidacao } from '../../testes/regras/executarValidacao.js';
import { autorizacaoDelegada } from '../autorizacoes/autorizacaoDelegada.js';
import { ResultadoTrabalho, Trabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';


import { executarK6Agendado } from './executarK6Agendado.js';
import { executarRunQaseAgendada } from './executarRunQaseAgendada.js';
import { projetoDaRotina } from './projetoDaRotina.js';
import { resultadoDaEvidencia } from './resultadoDaEvidencia.js';
import { validarTicketAgendado } from './validarTicketAgendado.js';
import { gravarEstadoDasRotinas } from '../banco/gravarEstadoDasRotinas.js';
import { lerEstadoDasRotinas } from '../banco/lerEstadoDasRotinas.js';

async function analisarMudancasAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
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


async function consultarJiraAgendada(e: EstadoDoWorker, r: Rotina): Promise<ResultadoTrabalho> {
  if (!e.d.servicos) return { status: 'BLOCKED', motivo: 'SERVICES_UNAVAILABLE: conexões de serviço indisponíveis neste processo.' };
  const res = await e.d.servicos.consultar(r.espacoId, 'jira', r.operacaoJira, { limite: 50 }, r.ticket);
  const lista = (Array.isArray(res.dados) ? res.dados : [res.dados]) as Record<string, unknown>[]; const atual: Record<string, string> = {};
  for (const i of lista.slice(0, 50)) { const f = (i.fields ?? {}) as Record<string, unknown>; if (typeof i.key === 'string') atual[i.key] = String(f.updated ?? ''); }
  const est = lerEstadoDasRotinas(e.base); const antes = est.itens[r.id]?.jira;
  const alterados = antes ? Object.keys(atual).filter(k => antes[k] !== atual[k]) : [];
  est.itens[r.id] = { ...est.itens[r.id], jira: atual }; gravarEstadoDasRotinas(est, e.base);
  return { status: 'INFO', motivo: antes ? `${Object.keys(atual).length} ticket(s) consultado(s); ${alterados.length} novo(s) ou alterado(s) desde a última consulta.` : `${Object.keys(atual).length} ticket(s) consultado(s); primeira consulta serve de referência.`, detalhes: alterados.slice(0, 20).join('\n') || undefined, ticket: r.ticket };
}


export async function executarTrabalhoDaRotina(e: EstadoDoWorker, t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
  const manual = t.origem === 'MANUAL';
  switch (r.tipo) {
    case 'smoke': case 'regressao': {
      const p = await projetoDaRotina(e, r.espacoId);
      const ev = await (e.d.executar ?? executarValidacao)(p, r.capability!, manual, manual ? undefined : autorizacaoDelegada(r.espacoId, r.ambiente, e.base, e.agora), e.abort.signal);
      return resultadoDaEvidencia(ev);
    }
    case 'validacao-ticket': return validarTicketAgendado(e, r, manual);
    case 'k6': return executarK6Agendado(e, r, manual);
    case 'run-qase': return executarRunQaseAgendada(e, t, r);
    case 'consulta-jira': return consultarJiraAgendada(e, r);
    case 'analise-mudancas': return analisarMudancasAgendada(e, r);
  }
}
