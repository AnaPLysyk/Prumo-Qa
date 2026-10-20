/** Canal agenda:revogar: Revogar uma autorização de execução. */
import { revogarAutorizacao } from '../autorizacoes/revogarAutorizacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaRevogar: TratadorDoCanal<'agenda:revogar'> = a => ({ autorizacao: revogarAutorizacao('execucoes', a.id) });
