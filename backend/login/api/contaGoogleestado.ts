/** Canal conta:googleestado: Ver como está a entrada pelo Google, ou desistir dela. */
import { estadoDaEntrada } from '../regras/entradaPorProvedor.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGoogleestado: TratadorDoCanal<'conta:googleestado'> = a => estadoDaEntrada(a.cancelar);
