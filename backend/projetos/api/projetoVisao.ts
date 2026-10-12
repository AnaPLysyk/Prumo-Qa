/** Canal projeto:visao: Métricas do projeto calculadas do histórico real. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { visaoGeralDoProjeto } from '../regras/visaoGeralDoProjeto.js';

export const projetoVisao: TratadorDoCanal<'projeto:visao'> = a => visaoGeralDoProjeto(a.root);
