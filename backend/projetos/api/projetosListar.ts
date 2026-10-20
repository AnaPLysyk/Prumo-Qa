/** Canal projetos:listar: Listar projetos vinculados com a situação do contrato. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarPastasVinculadas } from '../regras/consultasDeVinculos.js';

export const projetosListar: TratadorDoCanal<'projetos:listar'> = () => listarPastasVinculadas();
