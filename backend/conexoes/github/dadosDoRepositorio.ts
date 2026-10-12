/** Lê os dados do repositório (branch padrão, nome). */
import { z } from 'zod';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export async function dadosDoRepositorio(ctx: ContextoServico, rec: Recurso) {
  return z.object({ default_branch: z.string(), full_name: z.string(), id: z.number() }).passthrough().parse(await ctx.ler(caminhoDoRepositorio(rec)));
}
