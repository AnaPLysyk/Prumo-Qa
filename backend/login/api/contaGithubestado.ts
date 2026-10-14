/** Canal conta:githubestado: Ver como está a entrada pelo GitHub, ou desistir dela. */
import { estadoDaEntradaGithub } from '../regras/entradaPeloGithub.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGithubestado: TratadorDoCanal<'conta:githubestado'> = a => estadoDaEntradaGithub(a.cancelar);
