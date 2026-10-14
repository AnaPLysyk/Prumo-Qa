/** Canal propostas:vincular: Vincular uma proposta de bug a um ticket que já existe no Jira. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { vincularPropostaATicket } from '../regras/vincularPropostaATicket.js';

export const propostasVincular: TratadorDoCanal<'propostas:vincular'> = a => vincularPropostaATicket(a.id, a.chave);
