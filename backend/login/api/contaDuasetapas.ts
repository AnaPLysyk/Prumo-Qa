/** Canal conta:duasetapas: Ligar ou desligar a própria verificação em duas etapas (pede a senha atual). */
import { alterarMinhasDuasEtapas } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaDuasetapas: TratadorDoCanal<'conta:duasetapas'> = a => alterarMinhasDuasEtapas(a);
