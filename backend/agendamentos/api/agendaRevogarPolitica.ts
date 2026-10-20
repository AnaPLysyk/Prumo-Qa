/** Canal agenda:revogarpolitica: Revogar uma política de publicação. */
import { revogarAutorizacao } from '../autorizacoes/revogarAutorizacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaRevogarPolitica: TratadorDoCanal<'agenda:revogarpolitica'> = a => ({ politica: revogarAutorizacao('publicacoes', a.id) });
