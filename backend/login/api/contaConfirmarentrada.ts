/** Canal conta:confirmarentrada: Terminar a entrada em duas etapas com o código mandado ao e-mail da conta. */
import { confirmarEntrada } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaConfirmarentrada: TratadorDoCanal<'conta:confirmarentrada'> = a => confirmarEntrada(a);
