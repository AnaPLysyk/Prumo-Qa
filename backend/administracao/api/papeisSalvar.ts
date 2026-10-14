/** Canal papeis:salvar: Criar ou alterar um papel e o nível de cada tela. */
import { salvarPapel } from '../regras/papeis.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const papeisSalvar: TratadorDoCanal<'papeis:salvar'> = a => salvarPapel(a);
