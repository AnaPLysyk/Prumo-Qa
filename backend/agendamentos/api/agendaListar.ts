/** Canal agenda:listar: Listar as rotinas agendadas com próxima e última execução, permissões e autorizações. */
import { listarAgenda } from '../regras/listarAgenda.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaListar: TratadorDoCanal<'agenda:listar'> = a => listarAgenda(a.espacoId);
