/** Reúne detalhes jira da funcionalidade, mantendo cada operação identificável pelo nome. */
import { ParametrosConsulta } from "../tipos/ParametrosConsulta.js";
import { ResultadoConsulta } from "../tipos/ResultadoConsulta.js";
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";
import { projetoDoTicket } from "../../tickets/integracoesJira.js";
import { camposDoTipo, tiposDeCriacao } from "../../tickets/integracoesJira.js";
import { transicoesDoTicket } from "../../tickets/integracoesJira.js";

export async function consultarAnexosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number(), mimeType: z.string().optional(), created: z.string().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}?fields=attachment`));
        return { dados: r.fields.attachment.slice(0, 100).map(a => ({ id: a.id, nome: a.filename, bytes: a.size, tipo: a.mimeType ?? null, criado: a.created ?? null })), proxima: null, endpoint: '/rest/api/3/issue/{key}?fields=attachment' };
}

export async function consultarCamposTipoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, numero } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await camposDoTipo(ctx, rec, numero()), proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes/{id}` };
}

export async function consultarHistoricoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, p, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ values: z.array(z.object({ id: z.string(), created: z.string(), author: z.object({ displayName: z.string().optional() }).passthrough().optional(), items: z.array(z.object({ field: z.string(), fromString: z.string().nullable().optional(), toString: z.string().nullable().optional() }).passthrough()).default([]) }).passthrough()).default([]), total: z.number().optional(), isLast: z.boolean().optional() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}/changelog?startAt=${p.offset}&maxResults=${p.limite}`));
        return { dados: r.values.map(h => ({ id: h.id, em: h.created, por: h.author?.displayName ?? null, mudancas: h.items.slice(0, 20).map(i => ({ campo: i.field, de: i.fromString ?? null, para: i.toString ?? null })) })), proxima: r.isLast === false ? p.offset + r.values.length : null, endpoint: '/rest/api/3/issue/{key}/changelog' };
}

export async function consultarMetadadosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec } = parametros;
  if (ctx.servico !== 'jira') return null; const tipos = await tiposDeCriacao(ctx, rec); return { dados: tipos, proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes` };
}

export async function consultarTransicoesJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await transicoesDoTicket(ctx, rec, ticket()), proxima: null, endpoint: '/rest/api/3/issue/{key}/transitions' };
}
