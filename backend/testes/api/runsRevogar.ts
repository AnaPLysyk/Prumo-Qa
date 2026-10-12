/** Canal runs:revogar: Revogar uma política de escrita agendada. */
import { revogarPoliticaEscrita } from '../../agendamentos/autorizacoes/revogarPoliticaEscrita.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const runsRevogar: TratadorDoCanal<'runs:revogar'> = a => ({ politica: revogarPoliticaEscrita(a.id) });
