/** Canal operacoes:listar: Livro-razão das operações externas por projeto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarOperacoes } from '../banco/listarOperacoes.js';

export const operacoesListar: TratadorDoCanal<'operacoes:listar'> = a => listarOperacoes(a.espacoId, a.limite ?? 100);
