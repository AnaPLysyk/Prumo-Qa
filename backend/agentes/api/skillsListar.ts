/** Canal skills:listar: Listar os trechos do banco de Skills por especialização, estado e busca. */
import { listarTrechosDeSkill } from '../banco/listarTrechosDeSkill.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const skillsListar: TratadorDoCanal<'skills:listar'> = a => listarTrechosDeSkill({ especializacao: a.especializacao ?? null, estados: a.estados, busca: a.busca });
