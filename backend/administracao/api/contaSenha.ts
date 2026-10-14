/** Canal conta:senha: Trocar a própria senha, inclusive a temporária. */
import { trocarMinhaSenha } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaSenha: TratadorDoCanal<'conta:senha'> = a => trocarMinhaSenha(a);
