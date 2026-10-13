/** Canal skills:criar: Acrescentar um trecho escrito pela equipe à Skill de uma especialização. */
import { registrarTrechosDeSkill } from '../banco/registrarTrechosDeSkill.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const skillsCriar: TratadorDoCanal<'skills:criar'> = a => registrarTrechosDeSkill([{ especializacao: a.especializacao, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' }])[0];
