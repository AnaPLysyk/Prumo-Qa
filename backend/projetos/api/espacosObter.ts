/** Canal espacos:obter: Abre um projeto do Prumo com vínculos, relações e histórico. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { obterEspaco } from '../banco/obterEspaco.js';

export const espacosObter: TratadorDoCanal<'espacos:obter'> = a=>obterEspaco(a.id);
