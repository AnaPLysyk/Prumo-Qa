/** Canal propostas:listar: Listar propostas de casos e bugs (da pessoa, do Prumo ou de uma IA). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarPropostas } from '../banco/listarPropostas.js';

export const propostasListar: TratadorDoCanal<'propostas:listar'> = a => listarPropostas(a.espacoId);
