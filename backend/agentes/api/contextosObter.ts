/** Canal contextos:obter: Ver um contexto com seu histórico completo de alterações. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { obterContextoDaPasta } from '../regras/obterContextoDaPasta.js';

export const contextosObter: TratadorDoCanal<'contextos:obter'> = a => obterContextoDaPasta(a.root, a.id);
