/** Reúne detalhes github da funcionalidade, mantendo cada operação identificável pelo nome. */
import { ParametrosConsulta } from "../tipos/ParametrosConsulta.js";
import { ResultadoConsulta } from "../tipos/ResultadoConsulta.js";
import { z } from "zod";
import { ErroServico } from "./ErroServico.js";
import { codificarParaUrl } from "../../compartilhado/texto/codificarParaUrl.js";

export async function consultarArtefatosGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.object({ artifacts: z.array(z.object({ id: z.number(), name: z.string(), size_in_bytes: z.number(), expired: z.boolean(), created_at: z.string().nullable().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/artifacts?${pg}`));
        return { dados: r.artifacts.map(a => ({ id: a.id, nome: a.name, bytes: a.size_in_bytes, expirado: a.expired, criado: a.created_at ?? null })), proxima: prox(r.artifacts.length), endpoint: `${repo}/actions/runs/{id}/artifacts` };
}

export async function consultarCommitGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, id, repo } = parametros;
  if (ctx.servico !== 'github') return null; if (!id || !/^[a-f0-9]{7,40}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
        const r = z.object({ sha: z.string(), html_url: z.string().optional(), commit: z.object({ message: z.string(), author: z.object({ name: z.string().optional(), date: z.string().optional() }).passthrough().optional() }).passthrough(), files: z.array(z.object({ filename: z.string(), status: z.string(), additions: z.number().optional(), deletions: z.number().optional() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`${repo}/commits/${id}`));
        return { dados: { sha: r.sha, url: r.html_url ?? null, mensagem: ctx.limpar(r.commit.message), autor: r.commit.author?.name ?? null, data: r.commit.author?.date ?? null, arquivos: r.files.slice(0, 100).map(x => ({ nome: x.filename, estado: x.status, adicoes: x.additions ?? 0, remocoes: x.deletions ?? 0 })) }, proxima: null, endpoint: `${repo}/commits/{sha}` };
}

export async function consultarJobsGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.object({ jobs: z.array(z.object({ id: z.number(), name: z.string(), status: z.string(), conclusion: z.string().nullable(), html_url: z.string().optional(), started_at: z.string().nullable().optional(), completed_at: z.string().nullable().optional(), steps: z.array(z.object({ name: z.string(), status: z.string(), conclusion: z.string().nullable(), number: z.number() }).passthrough()).default([]) }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/jobs?${pg}`));
        return { dados: r.jobs.map(j => ({ id: j.id, nome: j.name, estado: j.status, conclusao: j.conclusion, url: j.html_url ?? null, inicio: j.started_at ?? null, fim: j.completed_at ?? null, etapas: j.steps.slice(0, 60).map(s => ({ n: s.number, nome: s.name, estado: s.status, conclusao: s.conclusion })) })), proxima: prox(r.jobs.length), endpoint: `${repo}/actions/runs/{id}/jobs` };
}

export async function consultarRevisoesGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, repo, pg, prox, numero } = parametros;
  if (ctx.servico !== 'github') return null;
        const r = z.array(z.object({ id: z.number(), state: z.string(), user: z.object({ login: z.string() }).passthrough().nullable().optional(), submitted_at: z.string().nullable().optional(), html_url: z.string().optional() }).passthrough()).parse(await ctx.ler(`${repo}/pulls/${numero()}/reviews?${pg}`));
        return { dados: r.map(x => ({ id: x.id, estado: x.state, por: x.user?.login ?? null, em: x.submitted_at ?? null, url: x.html_url ?? null })), proxima: prox(r.length), endpoint: `${repo}/pulls/{n}/reviews` };
}

export async function consultarWorkflowsGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, f, repo, pg, prox } = parametros;
  if (ctx.servico !== 'github') return null; const br = f.branch ? `&branch=${codificarParaUrl(f.branch)}` : '';
        const r = z.object({ total_count: z.number(), workflow_runs: z.array(z.object({ id: z.number(), name: z.string().nullable().optional(), status: z.string().nullable(), conclusion: z.string().nullable(), head_branch: z.string().nullable().optional(), head_sha: z.string(), event: z.string().optional(), run_number: z.number().optional(), html_url: z.string().optional(), created_at: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs?${pg}${br}`));
        return { dados: r.workflow_runs.map(w => ({ id: w.id, nome: w.name ?? null, estado: w.status, conclusao: w.conclusion, branch: w.head_branch ?? null, commit: w.head_sha, evento: w.event ?? null, numero: w.run_number ?? null, url: w.html_url ?? null, criado: w.created_at ?? null })), proxima: prox(r.workflow_runs.length), endpoint: `${repo}/actions/runs` };
}
