/** Escolhe o que fazer conforme o tipo da rotina (smoke, regressão, validação por ticket, k6, run do Qase, consulta Jira ou análise de mudanças) e devolve o resultado. */
import { executarValidacao } from '../../execucoes/regras/executarValidacao.js';
import { autorizacaoDelegada } from '../autorizacoes/autorizacaoDelegada.js';
import { ResultadoTrabalho, Trabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { analisarMudancasAgendada } from './analisarMudancasAgendada.js';
import { consultarJiraAgendada } from './consultarJiraAgendada.js';
import { executarK6Agendado } from './executarK6Agendado.js';
import { executarRunQaseAgendada } from './executarRunQaseAgendada.js';
import { projetoDaRotina } from './projetoDaRotina.js';
import { resultadoDaEvidencia } from './resultadoDaEvidencia.js';
import { validarTicketAgendado } from './validarTicketAgendado.js';

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
