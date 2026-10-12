/** Canal conhecimento:vocabulario: Listar os termos que um agente aprendeu com as correções da pessoa. */
import { vocabularioDoAgente } from '../banco/vocabularioDoAgente.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoVocabulario: TratadorDoCanal<'conhecimento:vocabulario'> = a => vocabularioDoAgente(a.agente);
