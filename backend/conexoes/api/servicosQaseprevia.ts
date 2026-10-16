/** Valida o token Qase e devolve a prévia paginada sem persistir a credencial. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
export const servicosQaseprevia: TratadorDoCanal<'servicos:qaseprevia'> = a => servicosDoAplicativo.qasePrever(a.token);
