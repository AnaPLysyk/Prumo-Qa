/** Descarta imediatamente uma prévia temporária da importação Qase. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
export const servicosQasecancelar: TratadorDoCanal<'servicos:qasecancelar'> = a => servicosDoAplicativo.qaseCancelar(a.previaId);
