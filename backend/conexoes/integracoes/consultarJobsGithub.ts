/** Consulta jobs no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';

export async function consultarJobsGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.object({ jobs: z.array(z.object({ id: z.number(), name: z.string(), status: z.string(), conclusion: z.string().nullable(), html_url: z.string().optional(), started_at: z.string().nullable().optional(), completed_at: z.string().nullable().optional(), steps: z.array(z.object({ name: z.string(), status: z.string(), conclusion: z.string().nullable(), number: z.number() }).passthrough()).default([]) }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/jobs?${pg}`));
        return { dados: r.jobs.map(j => ({ id: j.id, nome: j.name, estado: j.status, conclusao: j.conclusion, url: j.html_url ?? null, inicio: j.started_at ?? null, fim: j.completed_at ?? null, etapas: j.steps.slice(0, 60).map(s => ({ n: s.number, nome: s.name, estado: s.status, conclusao: s.conclusion })) })), proxima: prox(r.jobs.length), endpoint: `${repo}/actions/runs/{id}/jobs` };
}
