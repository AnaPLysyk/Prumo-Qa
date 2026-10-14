/** Canal usuarios:ativar: Ligar o login criando a primeira conta, de administrador. */
import { ativarLogin } from '../../login/regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosAtivar: TratadorDoCanal<'usuarios:ativar'> = a => ativarLogin(a);
