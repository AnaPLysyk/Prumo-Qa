/** Canal runs:revogar: Revogar uma política de escrita agendada. */
import { revogarAutorizacao } from '../../agendamentos/autorizacoes/revogarAutorizacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const runsRevogar: TratadorDoCanal<'runs:revogar'> = a => ({ politica: revogarAutorizacao('escritas', a.id) });
