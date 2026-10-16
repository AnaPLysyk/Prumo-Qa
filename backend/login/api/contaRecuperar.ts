/** Canal conta:recuperar: Definir senha nova com o código mandado ao e-mail da conta. */
import { recuperarConta } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaRecuperar: TratadorDoCanal<'conta:recuperar'> = a => recuperarConta(a);
