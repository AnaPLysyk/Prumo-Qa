/** Canal usuarios:senha: Redefinir a senha de outra pessoa com senha temporária. */
import { redefinirSenhaPelaAdministracao } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosSenha: TratadorDoCanal<'usuarios:senha'> = a => redefinirSenhaPelaAdministracao(a.id);
