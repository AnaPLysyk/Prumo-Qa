/** Consulta metadados no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { tiposDeCriacao } from '../../tickets/integracoes/tiposDoTicketJira.js';

export async function consultarMetadadosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec } = parametros;
  if (ctx.servico !== 'jira') return null; const tipos = await tiposDeCriacao(ctx, rec); return { dados: tipos, proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes` };
}
