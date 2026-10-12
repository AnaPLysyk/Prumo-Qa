/** Canal projeto:logs: Eventos de início e término das operações, com filtros. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarLogsDoProjeto } from '../regras/listarLogsDoProjeto.js';

export const projetoLogs: TratadorDoCanal<'projeto:logs'> = a => listarLogsDoProjeto(a.root, a.filter);
