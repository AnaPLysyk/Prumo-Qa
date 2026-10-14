/** Canal usuarios:desbloquear: Desbloquear conta travada por tentativas erradas. */
import { desbloquearConta } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosDesbloquear: TratadorDoCanal<'usuarios:desbloquear'> = a => desbloquearConta(a.id);
