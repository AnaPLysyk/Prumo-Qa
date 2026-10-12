/** Faz as consultas de detalhe (metadados, transições, histórico, anexos, workflows, commits...) de Jira, Qase e GitHub. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from './ErroServico.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { Filtros, OperacaoExtra, Pg } from '../tipos/leituras.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { camposDeSistema } from '../../testes/integracoes/camposDeSistema.js';
import { camposDoTipo } from '../../tickets/integracoes/camposDoTipo.js';
import { projetoDoTicket } from '../../tickets/integracoes/projetoDoTicket.js';
import { tiposDeCriacao } from '../../tickets/integracoes/tiposDeCriacao.js';
import { transicoesDoTicket } from '../../tickets/integracoes/transicoesDoTicket.js';

export async function lerDetalheDoServico(ctx: ContextoServico, rec: Recurso, op: OperacaoExtra, p: Pg, id?: string, f: Filtros = {}): Promise<{ dados: unknown; proxima: number | null; endpoint: string }> {
  const ticket = () => { if (!id || !/^[A-Z][A-Z0-9_]*-\d+$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const numero = () => { if (!id || !/^\d{1,15}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const repo = `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`; const pg = `per_page=${p.limite}&page=${Math.floor(p.offset / p.limite) + 1}`;
  const prox = (n: number) => (n === p.limite ? p.offset + n : null);
  switch (op) {
    case 'metadados': { if (ctx.servico !== 'jira') break; const tipos = await tiposDeCriacao(ctx, rec); return { dados: tipos, proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes` }; }
    case 'campos-tipo': { if (ctx.servico !== 'jira') break; return { dados: await camposDoTipo(ctx, rec, numero()), proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes/{id}` }; }
    case 'transicoes': { if (ctx.servico !== 'jira') break; return { dados: await transicoesDoTicket(ctx, rec, ticket()), proxima: null, endpoint: '/rest/api/3/issue/{key}/transitions' }; }
    case 'anexos': {
      if (ctx.servico !== 'jira') break; await projetoDoTicket(ctx, rec, ticket());
      const r = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number(), mimeType: z.string().optional(), created: z.string().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}?fields=attachment`));
      return { dados: r.fields.attachment.slice(0, 100).map(a => ({ id: a.id, nome: a.filename, bytes: a.size, tipo: a.mimeType ?? null, criado: a.created ?? null })), proxima: null, endpoint: '/rest/api/3/issue/{key}?fields=attachment' };
    }
    case 'historico': {
      if (ctx.servico !== 'jira') break; await projetoDoTicket(ctx, rec, ticket());
      const r = z.object({ values: z.array(z.object({ id: z.string(), created: z.string(), author: z.object({ displayName: z.string().optional() }).passthrough().optional(), items: z.array(z.object({ field: z.string(), fromString: z.string().nullable().optional(), toString: z.string().nullable().optional() }).passthrough()).default([]) }).passthrough()).default([]), total: z.number().optional(), isLast: z.boolean().optional() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}/changelog?startAt=${p.offset}&maxResults=${p.limite}`));
      return { dados: r.values.map(h => ({ id: h.id, em: h.created, por: h.author?.displayName ?? null, mudancas: h.items.slice(0, 20).map(i => ({ campo: i.field, de: i.fromString ?? null, para: i.toString ?? null })) })), proxima: r.isLast === false ? p.offset + r.values.length : null, endpoint: '/rest/api/3/issue/{key}/changelog' };
    }
    case 'plano': { if (ctx.servico !== 'qase') break; const r = z.object({ result: z.record(z.unknown()) }).passthrough().parse(await ctx.ler(`/v1/plan/${codificarParaUrl(rec.chave)}/${numero()}`)); return { dados: ctx.limpar(r.result), proxima: null, endpoint: '/v1/plan/{code}/{id}' }; }
    case 'campos-sistema': { if (ctx.servico !== 'qase') break; return { dados: await camposDeSistema(ctx), proxima: null, endpoint: '/v1/system_field' }; }
    case 'arquivos': {
      if (ctx.servico !== 'github') break; const caminho = (id ?? '').replace(/^\/+/, ''); if (caminho.split('/').some(s => s === '..' || s === '.') || /[\x00-\x1f\\]/.test(caminho) || caminho.length > 300) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      const ref = f.ref ? `?ref=${codificarParaUrl(f.ref)}` : ''; const r = await ctx.ler(`${repo}/contents/${caminho.split('/').filter(Boolean).map(codificarParaUrl).join('/')}${ref}`);
      if (Array.isArray(r)) return { dados: r.slice(0, 200).map(x => z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number().optional(), sha: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(x)).map(x => ({ nome: x.name, caminho: x.path, tipo: x.type, bytes: x.size ?? null, sha: x.sha ?? null, url: x.html_url ?? null })), proxima: null, endpoint: `${repo}/contents/{path}` };
      const a = z.object({ name: z.string(), path: z.string(), type: z.string(), size: z.number(), sha: z.string(), encoding: z.string().optional(), content: z.string().optional(), html_url: z.string().optional() }).passthrough().parse(r);
      const texto = a.encoding === 'base64' && a.content && a.size <= 100 * 1024 ? Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') : null;
      return { dados: { nome: a.name, caminho: a.path, tipo: a.type, bytes: a.size, sha: a.sha, url: a.html_url ?? null, conteudo: texto === null ? null : ctx.limpar(texto), conteudoOmitido: texto === null ? 'arquivo maior que 100 KB ou binário' : null }, proxima: null, endpoint: `${repo}/contents/{path}` };
    }
    case 'workflows': {
      if (ctx.servico !== 'github') break; const br = f.branch ? `&branch=${codificarParaUrl(f.branch)}` : '';
      const r = z.object({ total_count: z.number(), workflow_runs: z.array(z.object({ id: z.number(), name: z.string().nullable().optional(), status: z.string().nullable(), conclusion: z.string().nullable(), head_branch: z.string().nullable().optional(), head_sha: z.string(), event: z.string().optional(), run_number: z.number().optional(), html_url: z.string().optional(), created_at: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs?${pg}${br}`));
      return { dados: r.workflow_runs.map(w => ({ id: w.id, nome: w.name ?? null, estado: w.status, conclusao: w.conclusion, branch: w.head_branch ?? null, commit: w.head_sha, evento: w.event ?? null, numero: w.run_number ?? null, url: w.html_url ?? null, criado: w.created_at ?? null })), proxima: prox(r.workflow_runs.length), endpoint: `${repo}/actions/runs` };
    }
    case 'jobs': {
      if (ctx.servico !== 'github') break;
      const r = z.object({ jobs: z.array(z.object({ id: z.number(), name: z.string(), status: z.string(), conclusion: z.string().nullable(), html_url: z.string().optional(), started_at: z.string().nullable().optional(), completed_at: z.string().nullable().optional(), steps: z.array(z.object({ name: z.string(), status: z.string(), conclusion: z.string().nullable(), number: z.number() }).passthrough()).default([]) }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/jobs?${pg}`));
      return { dados: r.jobs.map(j => ({ id: j.id, nome: j.name, estado: j.status, conclusao: j.conclusion, url: j.html_url ?? null, inicio: j.started_at ?? null, fim: j.completed_at ?? null, etapas: j.steps.slice(0, 60).map(s => ({ n: s.number, nome: s.name, estado: s.status, conclusao: s.conclusion })) })), proxima: prox(r.jobs.length), endpoint: `${repo}/actions/runs/{id}/jobs` };
    }
    case 'artefatos': {
      if (ctx.servico !== 'github') break;
      const r = z.object({ artifacts: z.array(z.object({ id: z.number(), name: z.string(), size_in_bytes: z.number(), expired: z.boolean(), created_at: z.string().nullable().optional() }).passthrough()) }).passthrough().parse(await ctx.ler(`${repo}/actions/runs/${numero()}/artifacts?${pg}`));
      return { dados: r.artifacts.map(a => ({ id: a.id, nome: a.name, bytes: a.size_in_bytes, expirado: a.expired, criado: a.created_at ?? null })), proxima: prox(r.artifacts.length), endpoint: `${repo}/actions/runs/{id}/artifacts` };
    }
    case 'revisoes': {
      if (ctx.servico !== 'github') break;
      const r = z.array(z.object({ id: z.number(), state: z.string(), user: z.object({ login: z.string() }).passthrough().nullable().optional(), submitted_at: z.string().nullable().optional(), html_url: z.string().optional() }).passthrough()).parse(await ctx.ler(`${repo}/pulls/${numero()}/reviews?${pg}`));
      return { dados: r.map(x => ({ id: x.id, estado: x.state, por: x.user?.login ?? null, em: x.submitted_at ?? null, url: x.html_url ?? null })), proxima: prox(r.length), endpoint: `${repo}/pulls/{n}/reviews` };
    }
    case 'commit': {
      if (ctx.servico !== 'github') break; if (!id || !/^[a-f0-9]{7,40}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      const r = z.object({ sha: z.string(), html_url: z.string().optional(), commit: z.object({ message: z.string(), author: z.object({ name: z.string().optional(), date: z.string().optional() }).passthrough().optional() }).passthrough(), files: z.array(z.object({ filename: z.string(), status: z.string(), additions: z.number().optional(), deletions: z.number().optional() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`${repo}/commits/${id}`));
      return { dados: { sha: r.sha, url: r.html_url ?? null, mensagem: ctx.limpar(r.commit.message), autor: r.commit.author?.name ?? null, data: r.commit.author?.date ?? null, arquivos: r.files.slice(0, 100).map(x => ({ nome: x.filename, estado: x.status, adicoes: x.additions ?? 0, remocoes: x.deletions ?? 0 })) }, proxima: null, endpoint: `${repo}/commits/{sha}` };
    }
  }
  throw new ErroServico('SERVICE_WRITE_BLOCKED'); // operação não existe neste serviço
}
