/** Canal runs:listar: Listar as runs locais do projeto (preparadas, criadas, executadas e publicadas). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarRunsLocais } from '../banco/listarRunsLocais.js';

export const runsListar: TratadorDoCanal<'runs:listar'> = a => listarRunsLocais(a.espacoId);
