/** Canal usuarios:alterar: Aprovar, trocar papel ou nome, desativar ou reativar uma conta. */
import { alterarContaPelaAdministracao } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosAlterar: TratadorDoCanal<'usuarios:alterar'> = a => alterarContaPelaAdministracao(a);
