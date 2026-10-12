/** Lê o commit atual de um branch (ou nada se não existe). */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { sha40 } from '../tipos/escritaGithub.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export async function commitAtualDoBranch(ctx: ContextoServico, rec: Recurso, r: string): Promise<string | null> {
  try { return z.object({ object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/git/ref/heads/${r.split('/').map(codificarParaUrl).join('/')}`)).object.sha; }
  catch (e) { if (e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND') return null; throw e; }
}
