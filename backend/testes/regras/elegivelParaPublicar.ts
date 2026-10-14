/** Diz se uma execução agendada pode publicar o comentário: concluída, com ticket e coberta por política aprovada. */
import { politicaCobre } from '../../agendamentos/autorizacoes/politicaCobre.js';
import { Trabalho } from '../../agendamentos/tipos/fila.js';

/** Trabalhos agendados concluídos com ticket e política que cubra: prepara o registro; senão marca a razão (nunca publica sem política). */
export function elegivelParaPublicar(t: Trabalho, b?: string, agora = new Date()): 'SIM' | 'NAO_APLICAVEL' | 'SEM_POLITICA' {
  if (t.estado !== 'CONCLUIDO' || !t.ticket || (t.resultado?.status !== 'PASS' && t.resultado?.status !== 'FAIL')) return 'NAO_APLICAVEL';
  if (t.jira.estado === 'PUBLICADO') return 'NAO_APLICAVEL';
  return politicaCobre(t.espacoId, t.ticket, t.tipo, b, agora) ? 'SIM' : 'SEM_POLITICA';
}
