/** Canal servicos:recursos: Lista os projetos/repositórios que a conta enxerga, para escolher qual vincular. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosRecursos: TratadorDoCanal<'servicos:recursos'> = a=>servicosDoAplicativo.listar(a.id,a.pagina);
