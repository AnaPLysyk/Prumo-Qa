/** Canal servicos:consultar: Faz uma consulta de leitura no serviço vinculado (tickets, casos, runs, commits...) para as telas. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosConsultar: TratadorDoCanal<'servicos:consultar'> = a=>servicosDoAplicativo.consultar(a.espacoId,a.servico,a.operacao,a.pagina,a.id,a.filtros);
