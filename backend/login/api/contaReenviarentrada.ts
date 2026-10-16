/** Canal conta:reenviarentrada: Mandar outro código da entrada em duas etapas em andamento. */
import { reenviarCodigoDeEntrada } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaReenviarentrada: TratadorDoCanal<'conta:reenviarentrada'> = a => reenviarCodigoDeEntrada(a);
