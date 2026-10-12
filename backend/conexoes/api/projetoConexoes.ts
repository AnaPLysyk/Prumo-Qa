/** Canal projeto:conexoes: Propor configuração e consultar diagnóstico de integração por cliente. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { situacaoDasConexoesDeIa } from '../ia/situacaoDasConexoesDeIa.js';

export const projetoConexoes: TratadorDoCanal<'projeto:conexoes'> = a => situacaoDasConexoesDeIa(a.root);
