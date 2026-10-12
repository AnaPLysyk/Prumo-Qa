/** Canal conhecimento:listar: Listar conhecimentos gerais e do projeto, por agente e estado. */
import { listarConhecimentos } from '../banco/listarConhecimentos.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoListar: TratadorDoCanal<'conhecimento:listar'> = a => listarConhecimentos({ espacoId: a.espacoId, agente: a.agente ?? null, estados: a.estados, busca: a.busca, somenteDoAgente: a.somenteDoAgente });
