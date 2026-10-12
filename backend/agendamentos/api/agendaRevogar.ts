/** Canal agenda:revogar: Revogar uma autorização de execução. */
import { revogarExecucao } from '../autorizacoes/revogarExecucao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaRevogar: TratadorDoCanal<'agenda:revogar'> = a => ({ autorizacao: revogarExecucao(a.id) });
