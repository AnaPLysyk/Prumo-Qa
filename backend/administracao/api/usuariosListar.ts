/** Canal usuarios:listar: Listar as contas com papel, estado e último acesso. */
import { listarContas } from '../regras/gestaoDeContas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const usuariosListar: TratadorDoCanal<'usuarios:listar'> = () => listarContas();
