/** Canal skills:decidir: Aprovar ou descartar um trecho de Skill (rascunho importado ou de IA, ou um trecho existente). */
import { decidirTrechoDeSkill } from '../banco/decidirTrechoDeSkill.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const skillsDecidir: TratadorDoCanal<'skills:decidir'> = a => decidirTrechoDeSkill(a.id, a.estado);
