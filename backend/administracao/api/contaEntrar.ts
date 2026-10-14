/** Canal conta:entrar: Entrar com login e senha. */
import { entrarNaConta } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaEntrar: TratadorDoCanal<'conta:entrar'> = a => entrarNaConta(a);
