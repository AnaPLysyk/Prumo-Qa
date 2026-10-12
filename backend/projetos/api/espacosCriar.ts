/** Canal espacos:criar: Cria um projeto do Prumo com o nome e a descrição informados. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { criarEspaco } from '../regras/criarEspaco.js';

export const espacosCriar: TratadorDoCanal<'espacos:criar'> = a=>criarEspaco(a);
