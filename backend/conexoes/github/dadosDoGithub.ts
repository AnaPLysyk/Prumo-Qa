/** Reúne dados do github da funcionalidade, mantendo cada operação identificável pelo nome. */
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";
import { Recurso } from "../../projetos/contratos.js";
import { z } from "zod";
import { ContextoServico } from "../tipos/adaptador.js";
import { ErroServico } from "../integracoes/ErroServico.js";
import { sha40 } from "../tipos/escritaGithub.js";

export const caminhoDoRepositorio = (rec: Recurso) => `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`;

export async function dadosDoRepositorio(ctx: ContextoServico, rec: Recurso) {
  return z.object({ default_branch: z.string(), full_name: z.string(), id: z.number() }).passthrough().parse(await ctx.ler(caminhoDoRepositorio(rec)));
}

export async function commitAtualDoBranch(ctx: ContextoServico, rec: Recurso, r: string): Promise<string | null> {
  try { return z.object({ object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/git/ref/heads/${r.split('/').map(codificarParaUrl).join('/')}`)).object.sha; }
  catch (e) { if (e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND') return null; throw e; }
}
