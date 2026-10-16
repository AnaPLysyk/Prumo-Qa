/** Canal conta:cadastrar: Criar a própria conta por e-mail na tela de entrada, com o código de confirmação (pode aguardar aprovação). */
import { cadastrarConta } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaCadastrar: TratadorDoCanal<'conta:cadastrar'> = a => cadastrarConta(a);
