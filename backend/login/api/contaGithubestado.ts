/** Canal conta:githubestado: Ver como está a entrada pelo GitHub, ou desistir dela. */
import { estadoDaEntrada } from '../regras/entradaPorProvedor.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGithubestado: TratadorDoCanal<'conta:githubestado'> = a => estadoDaEntrada(a.cancelar);
