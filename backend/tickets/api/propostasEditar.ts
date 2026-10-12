/** Canal propostas:editar: Editar uma proposta; invalida a revisão anterior. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { editarProposta } from '../regras/editarProposta.js';

export const propostasEditar: TratadorDoCanal<'propostas:editar'> = a => editarProposta(a.id, a.dados, { requisito: a.requisito, risco: a.risco });
