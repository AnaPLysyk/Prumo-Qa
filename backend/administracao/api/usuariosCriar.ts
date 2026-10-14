/** Canal usuarios:criar: Criar conta para outra pessoa com senha temporária. */
import { criarContaPelaAdministracao } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosCriar: TratadorDoCanal<'usuarios:criar'> = a => criarContaPelaAdministracao(a);
