/** Canal execucoes:listar: Histórico centralizado de execuções por projeto, repositório, ticket, rotina, estado e período. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarExecucoes } from '../regras/listarExecucoes.js';

export const execucoesListar: TratadorDoCanal<'execucoes:listar'> = a => listarExecucoes(a.filtro);
