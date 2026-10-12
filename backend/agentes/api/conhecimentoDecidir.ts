/** Canal conhecimento:decidir: Aprovar ou descartar um conhecimento (rascunho vindo do chat ou de IA, ou um item existente). */
import { decidirConhecimento } from '../banco/decidirConhecimento.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoDecidir: TratadorDoCanal<'conhecimento:decidir'> = a => decidirConhecimento(a.id, a.estado);
