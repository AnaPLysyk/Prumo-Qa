/** Procura no Jira um ticket já criado pelo Prumo (pelo rótulo-marcador), para não criar duas vezes. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Remoto } from '../../conexoes/tipos/operacao.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { enderecoDoTicket } from './formatoDoTicket.js';

export const acharTicketCriadoPeloPrumo = async (ctx: ContextoServico, rec: Recurso, rot: string): Promise<Remoto | null> => {
  const jql = `project = ${rec.id} AND labels = "${rot}"`;
  const r = z.object({ issues: z.array(z.object({ key: z.string(), id: z.string() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/search/jql?jql=${codificarParaUrl(jql)}&fields=key&maxResults=1`));
  const i = r.issues[0]; return i ? { id: i.id, chave: i.key, url: enderecoDoTicket(ctx, i.key) } : null;
};
