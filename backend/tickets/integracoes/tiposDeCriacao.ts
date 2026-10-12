/** Consulta no Jira os tipos de ticket que podem ser criados no projeto vinculado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export async function tiposDeCriacao(ctx: ContextoServico, rec: Recurso) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${codificarParaUrl(rec.chave)}/issuetypes?maxResults=50`)) as { issueTypes?: unknown[]; values?: unknown[] };
  const lista = z.array(z.object({ id: z.union([z.string(), z.number()]).transform(String), name: z.string(), subtask: z.boolean().optional() }).passthrough()).parse(r.issueTypes ?? r.values ?? []);
  return lista.map(t => ({ id: t.id, nome: t.name, subtarefa: t.subtask === true }));
}
