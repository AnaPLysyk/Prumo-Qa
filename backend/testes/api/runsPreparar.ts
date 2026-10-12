/** Canal runs:preparar: Preparar uma run local com casos do Qase e identificar quais têm automação associada. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { prepararRunLocal } from '../regras/prepararRunLocal.js';

export const runsPreparar: TratadorDoCanal<'runs:preparar'> = a => prepararRunLocal(a.espacoId, { titulo: a.titulo, ambiente: a.ambiente, casos: a.casos, planoId: a.planoId });
