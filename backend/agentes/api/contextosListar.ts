/** Canal contextos:listar: Listar e pesquisar os contextos do projeto (requisitos, regras, critérios, restrições, decisões). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarContextosDaPasta } from '../regras/listarContextosDaPasta.js';

export const contextosListar: TratadorDoCanal<'contextos:listar'> = a => listarContextosDaPasta(a.root, a.filter);
