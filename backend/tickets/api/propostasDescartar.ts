/** Canal propostas:descartar: Descartar uma proposta. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { descartarProposta } from '../regras/edicaoDaProposta.js';

export const propostasDescartar: TratadorDoCanal<'propostas:descartar'> = a => descartarProposta(a.id);
