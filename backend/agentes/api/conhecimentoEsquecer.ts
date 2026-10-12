/** Canal conhecimento:esquecer: Fazer um agente esquecer um termo aprendido. */
import { esquecerTermo } from '../banco/esquecerTermo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoEsquecer: TratadorDoCanal<'conhecimento:esquecer'> = a => esquecerTermo(a.agente, a.termo);
