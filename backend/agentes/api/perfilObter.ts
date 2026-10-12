/** Canal perfil:obter: Ler como a pessoa quer ser chamada e o papel dela. */
import { lerPerfil } from '../banco/lerPerfil.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const perfilObter: TratadorDoCanal<'perfil:obter'> = () => lerPerfil();
