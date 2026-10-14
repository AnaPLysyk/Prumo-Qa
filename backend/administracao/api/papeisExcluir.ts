/** Canal papeis:excluir: Excluir um papel que ninguém usa. */
import { excluirPapel } from '../regras/papeis.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const papeisExcluir: TratadorDoCanal<'papeis:excluir'> = a => excluirPapel(a.id);
