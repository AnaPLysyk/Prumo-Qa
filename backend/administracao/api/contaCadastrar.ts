/** Canal conta:cadastrar: Criar a própria conta pela tela de entrada (pode aguardar aprovação). */
import { cadastrarConta } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaCadastrar: TratadorDoCanal<'conta:cadastrar'> = a => cadastrarConta(a);
