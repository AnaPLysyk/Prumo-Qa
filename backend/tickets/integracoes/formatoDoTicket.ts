/** Reúne formato do ticket da funcionalidade, mantendo cada operação identificável pelo nome. */
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";
import { ErroServico } from "../../conexoes/integracoes/ErroServico.js";
import { Recurso } from "../../projetos/tipos/espacos.js";

export const enderecoDoTicket = (ctx: ContextoServico, k: string) => `${ctx.instancia}/browse/${k}`;

/** Converte texto simples no formato de documento do Jira (ADF), só com parágrafos, sem HTML. */

/** Converte texto simples em documento ADF para o Jira. */
/** Texto simples -> documento Atlassian (ADF) só com parágrafos. O Prumo nunca envia HTML nem marcação executável ao Jira. */
export function textoParaAdf(texto: string): { type: 'doc'; version: 1; content: unknown[] } {
  const linhas = texto.replace(/\r\n?/g, '\n').split('\n').slice(0, 400);
  return { type: 'doc', version: 1, content: linhas.map(l => (l ? { type: 'paragraph', content: [{ type: 'text', text: l.slice(0, 2000) }] } : { type: 'paragraph' })) };
}

/** Confirma que o ticket pertence ao projeto Jira vinculado (nunca escreve em ticket de outro projeto). */
export async function projetoDoTicket(ctx: ContextoServico, rec: Recurso, t: string) {
  const r = z.object({ fields: z.object({ project: z.object({ id: z.union([z.string(), z.number()]).transform(String) }).passthrough(), status: z.object({ name: z.string() }).passthrough().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}?fields=project,status`));
  if (r.fields.project.id !== rec.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return { status: r.fields.status?.name ?? null };
}
