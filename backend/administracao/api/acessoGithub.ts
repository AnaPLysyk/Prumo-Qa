/** Canal acesso:github: Guardar o Client ID e o segredo do OAuth App do GitHub usado no login. */
import { salvarEntradaDoProvedor } from '../../login/regras/configuracaoDoLogin.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const acessoGithub: TratadorDoCanal<'acesso:github'> = a => salvarEntradaDoProvedor('github', a);
