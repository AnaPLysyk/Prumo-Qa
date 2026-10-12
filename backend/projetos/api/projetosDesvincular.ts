/** Canal projetos:desvincular: Remover o vínculo de um projeto da lista. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { desvincularPasta } from '../regras/desvincularPasta.js';

export const projetosDesvincular: TratadorDoCanal<'projetos:desvincular'> = a => desvincularPasta(a.root);
