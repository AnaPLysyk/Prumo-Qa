/** Canal projeto:historico: Operações consolidadas com achados e recomendações padronizadas. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarHistoricoDoProjeto } from '../regras/listarHistoricoDoProjeto.js';

export const projetoHistorico: TratadorDoCanal<'projeto:historico'> = a => listarHistoricoDoProjeto(a.root, a.filter);
