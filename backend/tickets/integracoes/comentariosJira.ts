/** Reúne comentarios jira da funcionalidade, mantendo cada operação identificável pelo nome. */
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Remoto } from "../../conexoes/tipos/operacao.js";
import { enderecoDoTicket } from "./enderecoDoTicket.js";
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";
import { marcadorDaOperacao } from "../../conexoes/escrita/marcadorDaOperacao.js";

export const acharComentarioDoPrumo = async (ctx: ContextoServico, t: string, k: string): Promise<Remoto | null> => { const c = (await comentariosDoTicket(ctx, t)).find(x => JSON.stringify(x.body).includes(marcadorNoComentario(k))); return c ? { id: c.id, chave: t, url: enderecoDoTicket(ctx, t) } : null; };

export const comentariosDoTicket = async (ctx: ContextoServico, t: string) => z.object({ comments: z.array(z.object({ id: z.string(), body: z.unknown() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}/comment?maxResults=100&orderBy=-created`)).comments;

export const marcadorNoComentario = (k: string) => `[${marcadorDaOperacao(k)}]`;
