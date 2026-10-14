/** Canal acesso:google: Guardar o Client ID e o segredo do aplicativo do Google usado no login. */
import { salvarEntradaDoProvedor } from '../../login/regras/configuracaoDoLogin.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const acessoGoogle: TratadorDoCanal<'acesso:google'> = a => salvarEntradaDoProvedor('google', a);
