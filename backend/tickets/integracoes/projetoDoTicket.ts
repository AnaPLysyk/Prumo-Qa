/** Confere que o ticket pertence ao projeto Jira vinculado antes de qualquer escrita. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

/** Confirma que o ticket pertence ao projeto Jira vinculado (nunca escreve em ticket de outro projeto). */
export async function projetoDoTicket(ctx: ContextoServico, rec: Recurso, t: string) {
  const r = z.object({ fields: z.object({ project: z.object({ id: z.union([z.string(), z.number()]).transform(String) }).passthrough(), status: z.object({ name: z.string() }).passthrough().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}?fields=project,status`));
  if (r.fields.project.id !== rec.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return { status: r.fields.status?.name ?? null };
}
