/** Canal testes:pipelines: Listar os pipelines do GitHub Actions (.github/workflows) da pasta vinculada ao projeto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { listarPipelines } from '../regras/listarPipelines.js';

export const testesPipelines: TratadorDoCanal<'testes:pipelines'> = (a) => { const e = obterEspaco(a.espacoId); return { pastaVinculada: !!e.pastaLocal, pipelines: e.pastaLocal ? listarPipelines(e.pastaLocal) : [] }; };
