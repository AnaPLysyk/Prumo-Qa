/** Canal espacos:editar: Altera o nome e a descrição de um projeto do Prumo. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { editarEspaco } from '../regras/edicaoDoEspaco.js';

export const espacosEditar: TratadorDoCanal<'espacos:editar'> = a=>editarEspaco(a.id,a.dados);
