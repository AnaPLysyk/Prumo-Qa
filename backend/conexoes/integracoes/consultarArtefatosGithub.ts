/** Consulta artefatos no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';

export async function consultarArtefatosGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.object({ artifacts: z.array(z.object({ id: z.number(), name: z.string(), size_in_bytes: z.number(), expired: z.boolean(), created_at: z.string().nullable().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/artifacts?${pg}`));
        return { dados: r.artifacts.map(a => ({ id: a.id, nome: a.name, bytes: a.size_in_bytes, expirado: a.expired, criado: a.created_at ?? null })), proxima: prox(r.artifacts.length), endpoint: `${repo}/actions/runs/{id}/artifacts` };
}
