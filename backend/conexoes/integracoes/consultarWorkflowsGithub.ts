/** Consulta workflows no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';

export async function consultarWorkflowsGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, id, f, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null; const br = f.branch ? `&branch=${codificarParaUrl(f.branch)}` : '';
        const r = z.object({ total_count: z.number(), workflow_runs: z.array(z.object({ id: z.number(), name: z.string().nullable().optional(), status: z.string().nullable(), conclusion: z.string().nullable(), head_branch: z.string().nullable().optional(), head_sha: z.string(), event: z.string().optional(), run_number: z.number().optional(), html_url: z.string().optional(), created_at: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs?${pg}${br}`));
        return { dados: r.workflow_runs.map(w => ({ id: w.id, nome: w.name ?? null, estado: w.status, conclusao: w.conclusion, branch: w.head_branch ?? null, commit: w.head_sha, evento: w.event ?? null, numero: w.run_number ?? null, url: w.html_url ?? null, criado: w.created_at ?? null })), proxima: prox(r.workflow_runs.length), endpoint: `${repo}/actions/runs` };
}
