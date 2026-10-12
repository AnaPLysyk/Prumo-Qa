/** Canal runs:bugs: Preparar rascunhos de bug para as falhas da run. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { propostasDeBugs } from '../regras/propostasDeBugs.js';

export const runsBugs: TratadorDoCanal<'runs:bugs'> = a => propostasDeBugs(a.id);
