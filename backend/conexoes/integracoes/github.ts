/** Consulta e converte dados externos da integração com GitHub. */
import { ParametrosConsulta } from "../tipos/ParametrosConsulta.js";
import { ResultadoConsulta } from "../tipos/ParametrosConsulta.js";
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { ErroServico } from "./ErroServico.js";
import { parametrosDaUrl, idNumericoDaConsulta } from "./formatos.js";
import { Recurso } from "../../projetos/contratos.js";
import { OperacaoServico, PlanoDaConsulta } from "../tipos/adaptador.js";
import { paginaSchema } from "../tipos/transporte.js";

export async function consultarArquivosGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, id, f, repo } = parametros;
  if (ctx.servico !== 'github') return null; const caminho = (id ?? '').replace(/^\/+/, ''); if (caminho.split('/').some(s => s === '..' || s === '.') || /[\x00-\x1f\\]/.test(caminho) || caminho.length > 300) throw new ErroServico('SERVICE_RESPONSE_INVALID');
        const ref = f.ref ? `?ref=${codificarParaUrl(f.ref)}` : ''; const r = await ctx.ler(`${repo}/contents/${caminho.split('/').filter(Boolean).map(codificarParaUrl).join('/')}${ref}`);
        if (Array.isArray(r)) return { dados: r.slice(0, 200).map(x => z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number().optional(), sha: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(x)).map(x => ({ nome: x.name, caminho: x.path, tipo: x.type, bytes: x.size ?? null, sha: x.sha ?? null, url: x.html_url ?? null })), proxima: null, endpoint: `${repo}/contents/{path}` };
        const a = z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number(), sha: z.string(), encoding: z.string().optional(), content: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(r);
        const texto = a.encoding === 'base64' && a.content && a.size <= 100 * 1024 ? Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') : null;
        return { dados: { nome: a.name, caminho: a.path, tipo: a.type, bytes: a.size, sha: a.sha, url: a.html_url ?? null, conteudo: texto === null ? null : ctx.limpar(texto), conteudoOmitido: texto === null ? 'arquivo maior que 100 KB ou binário' : null }, proxima: null, endpoint: `${repo}/contents/{path}` };
}

export async function consultarIssuesGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, f, repo, pg, prox } = parametros;
  if (ctx.servico !== 'github') return null;
  // Só os estados da API: "open" (padrão), "closed" ou "all". Qualquer outro filtro de status continua listando as abertas.
  const estado = f.status === 'closed' || f.status === 'all' ? f.status : 'open';
  const l = z.array(z.object({ number: z.number(), title: z.string(), state: z.string(), html_url: z.string().optional(), body: z.string().nullable().optional(), user: z.object({ login: z.string() }).passthrough().nullable().optional(), labels: z.array(z.union([z.string(), z.object({ name: z.string() }).passthrough()])).optional(), comments: z.number().optional(), created_at: z.string().optional(), updated_at: z.string().optional(), pull_request: z.unknown().optional() }).passthrough()).parse(await ctx.ler(`${repo}/issues?state=${estado}&sort=updated&direction=desc&${pg}`));
  // A próxima página conta os itens brutos: PRs filtrados não podem encerrar a paginação antes do fim.
  return { dados: l.filter(i => i.pull_request === undefined).map(i => ({ numero: i.number, titulo: i.title, estado: i.state, url: i.html_url ?? null, corpo: i.body ?? null, autor: i.user?.login ?? null, rotulos: (i.labels ?? []).map(x => (typeof x === 'string' ? x : x.name)), comentarios: i.comments ?? 0, criado: i.created_at ?? null, atualizado: i.updated_at ?? null })), proxima: prox(l.length), endpoint: `${repo}/issues` };
}

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

export function planoDaConsultaGithub(r: Recurso, operacao: OperacaoServico, p: z.output<typeof paginaSchema>, id?: string): PlanoDaConsulta {
  const repo = '/repos/' + r.chave.split('/').map(codificarParaUrl).join('/');
  const mapa: Partial<Record<OperacaoServico, string>> = { repositorio: '', branches: '/branches', commits: '/commits', prs: '/pulls', pr: '/pulls/' + (id ?? '') };
  if (operacao === 'verificacoes') {
    if (!id || !/^[a-f0-9]{40}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    return { endpoint: repo + '/commits/' + id + '/check-runs?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1 }), colecao: 'check_runs', envelope: 'github-checks' };
  }
  if (!(operacao in mapa)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (operacao === 'pr') idNumericoDaConsulta(id);
  return { endpoint: repo + mapa[operacao] + '?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1, state: operacao === 'prs' ? 'all' : undefined }), envelope: operacao === 'repositorio' || operacao === 'pr' ? 'object' : 'array' };
}
