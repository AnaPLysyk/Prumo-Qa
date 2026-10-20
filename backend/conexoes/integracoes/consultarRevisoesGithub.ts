/** Consulta revisoes no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';

export async function consultarRevisoesGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.array(z.object({ id: z.number(), state: z.string(), user: z.object({ login: z.string() }).passthrough().nullable().optional(), submitted_at: z.string().nullable().optional(), html_url: z.string().optional() }).passthrough()).parse(await ctx.ler(`${repo}/pulls/${numero()}/reviews?${pg}`));
        return { dados: r.map(x => ({ id: x.id, estado: x.state, por: x.user?.login ?? null, em: x.submitted_at ?? null, url: x.html_url ?? null })), proxima: prox(r.length), endpoint: `${repo}/pulls/{n}/reviews` };
}
