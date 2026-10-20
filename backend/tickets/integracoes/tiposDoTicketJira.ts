/** Reúne tipos do ticket jira da funcionalidade, mantendo cada operação identificável pelo nome. */
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Recurso } from "../../projetos/tipos/espacos.js";

export async function camposDoTipo(ctx: ContextoServico, rec: Recurso, tipoId: string) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${codificarParaUrl(rec.chave)}/issuetypes/${codificarParaUrl(tipoId)}?maxResults=100`)) as { fields?: unknown[]; values?: unknown[] };
  return z.array(z.object({ fieldId: z.string().optional(), key: z.string().optional(), name: z.string(), required: z.boolean().optional() }).passthrough()).parse(r.fields ?? r.values ?? []).map(c => ({ id: c.fieldId ?? c.key ?? '', nome: c.name, obrigatorio: c.required === true }));
}

export async function tiposDeCriacao(ctx: ContextoServico, rec: Recurso) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${codificarParaUrl(rec.chave)}/issuetypes?maxResults=50`)) as { issueTypes?: unknown[]; values?: unknown[] };
  const lista = z.array(z.object({ id: z.union([z.string(), z.number()]).transform(String), name: z.string(), subtask: z.boolean().optional() }).passthrough()).parse(r.issueTypes ?? r.values ?? []);
  return lista.map(t => ({ id: t.id, nome: t.name, subtarefa: t.subtask === true }));
}
