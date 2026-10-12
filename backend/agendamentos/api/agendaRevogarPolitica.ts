/** Canal agenda:revogarpolitica: Revogar uma política de publicação. */
import { revogarPublicacao } from '../autorizacoes/revogarPublicacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaRevogarPolitica: TratadorDoCanal<'agenda:revogarpolitica'> = a => ({ politica: revogarPublicacao(a.id) });
