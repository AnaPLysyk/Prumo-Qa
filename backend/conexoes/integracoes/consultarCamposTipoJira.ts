/** Consulta campos-tipo no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { camposDoTipo } from '../../tickets/integracoes/camposDoTipo.js';

export async function consultarCamposTipoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, id, numero } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await camposDoTipo(ctx, rec, numero()), proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes/{id}` };
}
