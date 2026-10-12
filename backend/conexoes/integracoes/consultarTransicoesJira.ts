/** Consulta transicoes no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { transicoesDoTicket } from '../../tickets/integracoes/transicoesDoTicket.js';

export async function consultarTransicoesJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await transicoesDoTicket(ctx, rec, ticket()), proxima: null, endpoint: '/rest/api/3/issue/{key}/transitions' };
}
