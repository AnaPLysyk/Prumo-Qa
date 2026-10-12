/** Consulta anexos no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { projetoDoTicket } from '../../tickets/integracoes/projetoDoTicket.js';

export async function consultarAnexosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number(), mimeType: z.string().optional(), created: z.string().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}?fields=attachment`));
        return { dados: r.fields.attachment.slice(0, 100).map(a => ({ id: a.id, nome: a.filename, bytes: a.size, tipo: a.mimeType ?? null, criado: a.created ?? null })), proxima: null, endpoint: '/rest/api/3/issue/{key}?fields=attachment' };
}
