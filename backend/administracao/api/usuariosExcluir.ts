/** Canal usuarios:excluir: Excluir conta pendente ou desativada. */
import { excluirConta } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosExcluir: TratadorDoCanal<'usuarios:excluir'> = a => excluirConta(a.id);
