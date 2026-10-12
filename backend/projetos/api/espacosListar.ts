/** Canal espacos:listar: Lista os projetos do Prumo para a tela Projetos. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { listarEspacos } from '../banco/listarEspacos.js';

export const espacosListar: TratadorDoCanal<'espacos:listar'> = ()=>listarEspacos();
