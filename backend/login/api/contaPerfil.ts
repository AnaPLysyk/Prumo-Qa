/** Canal conta:perfil: Trocar o próprio nome de exibição. */
import { alterarMeuNome } from '../regras/contas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaPerfil: TratadorDoCanal<'conta:perfil'> = a => alterarMeuNome(a.nome);
