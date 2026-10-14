/** Canal conta:sair: Encerrar a sessão de quem está no Prumo. */
import { sairDaConta } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaSair: TratadorDoCanal<'conta:sair'> = () => sairDaConta();
