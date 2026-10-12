/** Lê os 100 comentários mais recentes de um ticket. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';

export const comentariosDoTicket = async (ctx: ContextoServico, t: string) => z.object({ comments: z.array(z.object({ id: z.string(), body: z.unknown() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}/comment?maxResults=100&orderBy=-created`)).comments;
