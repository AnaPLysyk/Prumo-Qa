/** Canal papeis:listar: Listar os papéis e a matriz de permissões por tela. */
import { listarPapeis } from '../regras/papeis.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const papeisListar: TratadorDoCanal<'papeis:listar'> = () => listarPapeis();
