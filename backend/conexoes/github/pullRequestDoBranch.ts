/** Procura um Pull Request aberto do branch de trabalho. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export const pullRequestDoBranch = async (ctx: ContextoServico, rec: Recurso, branch: string) => {
  const dono = rec.chave.split('/')[0]!; const l = z.array(z.object({ number: z.number(), html_url: z.string(), state: z.string() }).passthrough()).parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/pulls?head=${codificarParaUrl(dono + ':' + branch)}&state=open&per_page=5`));
  return l[0] ?? null;
};
