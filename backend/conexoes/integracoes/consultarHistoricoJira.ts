/** Consulta historico no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { projetoDoTicket } from '../../tickets/integracoes/projetoDoTicket.js';

export async function consultarHistoricoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, p, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ values: z.array(z.object({ id: z.string(), created: z.string(), author: z.object({ displayName: z.string().optional() }).passthrough().optional(), items: z.array(z.object({ field: z.string(), fromString: z.string().nullable().optional(), toString: z.string().nullable().optional() }).passthrough()).default([]) }).passthrough()).default([]), total: z.number().optional(), isLast: z.boolean().optional() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}/changelog?startAt=${p.offset}&maxResults=${p.limite}`));
        return { dados: r.values.map(h => ({ id: h.id, em: h.created, por: h.author?.displayName ?? null, mudancas: h.items.slice(0, 20).map(i => ({ campo: i.field, de: i.fromString ?? null, para: i.toString ?? null })) })), proxima: r.isLast === false ? p.offset + r.values.length : null, endpoint: '/rest/api/3/issue/{key}/changelog' };
}
