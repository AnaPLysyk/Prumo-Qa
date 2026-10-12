/** Liga um caso do Qase ao ticket do Jira de origem. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export const associarCasoAoTicket = (ctx: ContextoServico, rec: Recurso, casoId: string, t: string) =>
  ctx.enviar('POST', `/v1/case/${codificarParaUrl(rec.chave)}/external-issue/attach`, JSON.stringify({ type: 'jira-cloud', links: [{ case_id: Number(casoId), external_issues: [t] }] }));
