/** Consulta as mudanças de status disponíveis para um ticket do projeto vinculado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { projetoDoTicket } from './formatoDoTicket.js';

export async function transicoesDoTicket(ctx: ContextoServico, rec: Recurso, t: string) {
  await projetoDoTicket(ctx, rec, t);
  const r = z.object({ transitions: z.array(z.object({ id: z.string(), name: z.string(), to: z.object({ name: z.string() }).passthrough().optional() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}/transitions`));
  return r.transitions.map(x => ({ id: x.id, nome: x.name, para: x.to?.name ?? null }));
}
