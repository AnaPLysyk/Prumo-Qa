import path from 'node:path';
import { z } from 'zod';
import { ErroServico } from './httpServicos.js';
import { multipart } from './multipart.js';
import { mascarar } from './projeto.js';
import { lerAnexo } from './escritaJira.js';
import { marcador, type DefOperacao, type Remoto } from './operacoesTipos.js';
import type { ContextoServico } from './adaptadoresServicos.js';
import type { Recurso } from './espacos.js';

/**
 * Escritas controladas no Qase TestOps (API v1, qase-tms/specs). O projeto é o código vinculado (rec.chave).
 * Rotas: POST /case|suite|plan|run/{code}, PATCH /case/{code}/{id}, POST /run/{code}/{id}/complete, POST /result/{code}/{run}/bulk,
 * POST /attachment/{code} (multipart, campo file[]), POST /case/{code}/external-issue/attach. Criação de caso, run e plano é
 * idempotente (busca por título e marcador); resultados levam o marcador no comentário e são conferidos relendo a run.
 * Não existe PASS sem execução: resultados só entram aqui com status vindo de uma execução ou de declaração humana explícita.
 */
const enc = encodeURIComponent;
const id = z.number().int().positive().max(999999999999);
const ticket = z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/);
const campoInt = z.number().int().min(0).max(100);
type Pagina = { entities: Record<string, unknown>[] };
const pagina = (v: unknown): Pagina => z.object({ result: z.object({ entities: z.array(z.record(z.unknown())).default([]) }).passthrough() }).passthrough().parse(v).result;
const idDe = (v: unknown) => z.object({ result: z.object({ id: z.union([z.number(), z.string()]).transform(String) }).passthrough() }).passthrough().parse(v).result.id;
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

async function listar(ctx: ContextoServico, rec: Recurso, tipo: 'case' | 'run' | 'plan' | 'suite', filtros: Record<string, string | number>, max = 100) {
  const q = new URLSearchParams({ limit: String(Math.min(max, 100)), offset: '0' }); for (const [k, v] of Object.entries(filtros)) q.set(k, String(v));
  return pagina(await ctx.ler(`/v1/${tipo}/${enc(rec.chave)}?${q}`)).entities;
}
export const camposDeSistema = async (ctx: ContextoServico) => z.object({ result: z.array(z.record(z.unknown())).default([]) }).passthrough().parse(await ctx.ler('/v1/system_field')).result.slice(0, 40).map(c => ctx.limpar(c));

const passo = z.object({ acao: z.string().trim().min(1).max(2000), esperado: z.string().max(2000).default(''), dados: z.string().max(2000).default('') }).strict();
const criarSuite = z.object({ titulo: z.string().trim().min(2).max(255), descricao: z.string().max(4000).default(''), paiId: id.optional() }).strict();
export const suiteCriar: DefOperacao<z.infer<typeof criarSuite>> = {
  id: 'qase.criar_suite', servico: 'qase', rotulo: 'Criar suite no Qase', efeito: 'Cria uma suite no projeto Qase vinculado.', exigeConfirmacao: true, schema: criarSuite,
  resumo: p => `Criar suite "${p.titulo}"`,
  async executar(ctx, rec, p) {
    const ja = (await listar(ctx, rec, 'suite', { search: p.titulo })).find(s => norm(String(s.title)) === norm(p.titulo) && (p.paiId === undefined || Number(s.parent_id) === p.paiId));
    if (ja) throw new ErroServico('SERVICE_DUPLICATE'); // já existe: nunca duplica
    const novo = idDe(await ctx.enviar('POST', `/v1/suite/${enc(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: mascarar(p.descricao), ...(p.paiId ? { parent_id: p.paiId } : {}) })));
    return { id: novo, detalhes: { titulo: p.titulo } };
  },
  async reconciliar(ctx, rec, p) { const s = (await listar(ctx, rec, 'suite', { search: p.titulo })).find(x => norm(String(x.title)) === norm(p.titulo)); return s ? { id: String(s.id), detalhes: { titulo: p.titulo } } : null; }
};

const criarCaso = z.object({
  titulo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), preCondicoes: z.string().max(4000).default(''), posCondicoes: z.string().max(4000).default(''),
  passos: z.array(passo).max(50).default([]), suiteId: id.optional(), prioridade: campoInt.optional(), severidade: campoInt.optional(), tipo: campoInt.optional(),
  automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).default('manual'), tags: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/)).max(10).default([]), ticket: ticket.optional()
}).strict();
const corpoCaso = (p: z.infer<typeof criarCaso>) => ({
  title: mascarar(p.titulo), description: mascarar(p.descricao), preconditions: mascarar(p.preCondicoes), postconditions: mascarar(p.posCondicoes),
  steps: p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })), steps_type: 'classic',
  isManual: p.automacao !== 'automatizado', isToBeAutomated: p.automacao === 'a-automatizar', tags: p.tags,
  ...(p.suiteId ? { suite_id: p.suiteId } : {}), ...(p.prioridade !== undefined ? { priority: p.prioridade } : {}), ...(p.severidade !== undefined ? { severity: p.severidade } : {}), ...(p.tipo !== undefined ? { type: p.tipo } : {})
});
const acharCaso = async (ctx: ContextoServico, rec: Recurso, p: { titulo: string; suiteId?: number }) =>
  (await listar(ctx, rec, 'case', { search: p.titulo, ...(p.suiteId ? { suite_id: p.suiteId } : {}) })).find(c => norm(String(c.title)) === norm(p.titulo) && (p.suiteId === undefined || Number(c.suite_id) === p.suiteId));
const associar = (ctx: ContextoServico, rec: Recurso, casoId: string, t: string) =>
  ctx.enviar('POST', `/v1/case/${enc(rec.chave)}/external-issue/attach`, JSON.stringify({ type: 'jira-cloud', links: [{ case_id: Number(casoId), external_issues: [t] }] }));
export const casoCriar: DefOperacao<z.infer<typeof criarCaso>> = {
  id: 'qase.criar_caso', servico: 'qase', rotulo: 'Criar caso de teste no Qase', efeito: 'Cria um caso (com passos e resultado esperado) no projeto Qase vinculado e, se informado, o associa ao ticket Jira de origem. Casos com o mesmo título na mesma suite não são duplicados.', exigeConfirmacao: true, schema: criarCaso,
  resumo: p => `Criar caso "${p.titulo}" (${p.passos.length} passo(s), ${p.automacao})${p.ticket ? ` para ${p.ticket}` : ''}`,
  async executar(ctx, rec, p) {
    if (await acharCaso(ctx, rec, p)) throw new ErroServico('SERVICE_DUPLICATE'); // o mesmo título já existe na suite
    const novo = idDe(await ctx.enviar('POST', `/v1/case/${enc(rec.chave)}`, JSON.stringify(corpoCaso(p))));
    const r: Remoto = { id: novo, chave: `${rec.chave}-${novo}`, detalhes: { titulo: p.titulo } };
    if (p.ticket) { try { await associar(ctx, rec, novo, p.ticket); r.detalhes!.ticket = p.ticket; } catch (e) { r.detalhes!.ticket = 'FALHOU:' + ((e as ErroServico).codigo ?? 'ERRO'); } }
    return r;
  },
  async reconciliar(ctx, rec, p) { const c = await acharCaso(ctx, rec, p); return c ? { id: String(c.id), chave: `${rec.chave}-${c.id}`, detalhes: { titulo: p.titulo } } : null; },
  async confirmar(ctx, rec, _p, r) { const c = z.object({ result: z.object({ id: z.number() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${enc(rec.chave)}/${enc(r.id!)}`)); return String(c.result.id) === r.id; }
};

const editarCaso = z.object({ casoId: id, titulo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), preCondicoes: z.string().max(4000).optional(), passos: z.array(passo).max(50).optional(), prioridade: campoInt.optional(), automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).optional() }).strict().refine(p => Object.keys(p).length > 1, 'nenhuma alteração');
export const casoEditar: DefOperacao<z.infer<typeof editarCaso>> = {
  id: 'qase.editar_caso', servico: 'qase', rotulo: 'Editar caso de teste no Qase', efeito: 'Altera título, descrição, pré-condições, passos, prioridade ou automação de um caso existente do projeto vinculado.', exigeConfirmacao: true, schema: editarCaso,
  resumo: p => `Editar caso ${p.casoId}: ${Object.keys(p).filter(k => k !== 'casoId').join(', ')}`,
  async executar(ctx, rec, p) {
    await ctx.ler(`/v1/case/${enc(rec.chave)}/${p.casoId}`); // 404 se o caso não pertence ao projeto vinculado
    const c: Record<string, unknown> = {}; if (p.titulo !== undefined) c.title = mascarar(p.titulo); if (p.descricao !== undefined) c.description = mascarar(p.descricao); if (p.preCondicoes !== undefined) c.preconditions = mascarar(p.preCondicoes);
    if (p.passos) { c.steps = p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })); c.steps_type = 'classic'; } if (p.prioridade !== undefined) c.priority = p.prioridade;
    if (p.automacao) { c.isManual = p.automacao !== 'automatizado'; c.isToBeAutomated = p.automacao === 'a-automatizar'; }
    await ctx.enviar('PATCH', `/v1/case/${enc(rec.chave)}/${p.casoId}`, JSON.stringify(c)); return { id: String(p.casoId), chave: `${rec.chave}-${p.casoId}` };
  },
  async confirmar(ctx, rec, p) { if (p.titulo === undefined) return true; const c = z.object({ result: z.object({ title: z.string() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${enc(rec.chave)}/${p.casoId}`)); return c.result.title === mascarar(p.titulo); }
};

const associarTicket = z.object({ casoId: id, ticket }).strict();
export const casoAssociarTicket: DefOperacao<z.infer<typeof associarTicket>> = {
  id: 'qase.associar_ticket', servico: 'qase', rotulo: 'Associar caso do Qase a ticket do Jira', efeito: 'Registra no Qase o ticket Jira (jira-cloud) de origem do caso.', exigeConfirmacao: true, schema: associarTicket,
  resumo: p => `Associar caso ${p.casoId} ao ticket ${p.ticket}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/case/${enc(rec.chave)}/${p.casoId}`); await associar(ctx, rec, String(p.casoId), p.ticket); return { id: String(p.casoId), chave: p.ticket }; },
  async reconciliar(ctx, rec, p) {
    const c = z.object({ result: z.object({ external_issues: z.array(z.object({ issues: z.array(z.object({ id: z.string() }).passthrough()).default([]) }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${enc(rec.chave)}/${p.casoId}`));
    return c.result.external_issues.some(g => g.issues.some(i => i.id === p.ticket)) ? { id: String(p.casoId), chave: p.ticket } : null;
  }
};

const criarPlano = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(500) }).strict();
async function casosExistem(ctx: ContextoServico, rec: Recurso, ids: number[]) { for (const c of [...new Set(ids)].slice(0, 500)) await ctx.ler(`/v1/case/${enc(rec.chave)}/${c}`); }
export const planoCriar: DefOperacao<z.infer<typeof criarPlano>> = {
  id: 'qase.criar_plano', servico: 'qase', rotulo: 'Criar plano de teste no Qase', efeito: 'Cria um plano com os casos escolhidos (todos conferidos no projeto vinculado).', exigeConfirmacao: true, schema: criarPlano,
  resumo: p => `Criar plano "${p.titulo}" com ${p.casos.length} caso(s)`,
  async executar(ctx, rec, p, k) {
    await casosExistem(ctx, rec, p.casos);
    const novo = idDe(await ctx.enviar('POST', `/v1/plan/${enc(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcador(k)}]`.trim(), cases: [...new Set(p.casos)] })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listar(ctx, rec, 'plan', {})).find(e => String(e.description ?? '').includes(`[${marcador(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; }
};

const criarRun = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(500), planoId: id.optional(), autoteste: z.boolean().default(false) }).strict();
export const runCriar: DefOperacao<z.infer<typeof criarRun>> = {
  id: 'qase.criar_run', servico: 'qase', rotulo: 'Criar test run no Qase', efeito: 'Cria uma run com os casos escolhidos. Criar a run não executa nada nem registra resultado.', exigeConfirmacao: true, schema: criarRun,
  resumo: p => `Criar run "${p.titulo}" com ${p.casos.length} caso(s)`,
  async executar(ctx, rec, p, k) {
    await casosExistem(ctx, rec, p.casos);
    const novo = idDe(await ctx.enviar('POST', `/v1/run/${enc(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcador(k)}]`.trim(), include_all_cases: false, cases: [...new Set(p.casos)], is_autotest: p.autoteste, ...(p.planoId ? { plan_id: p.planoId } : {}) })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listar(ctx, rec, 'run', { search: p.titulo })).find(e => String(e.description ?? '').includes(`[${marcador(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; },
  async confirmar(ctx, rec, _p, r) { const x = z.object({ result: z.object({ id: z.number() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/run/${enc(rec.chave)}/${enc(r.id!)}`)); return String(x.result.id) === r.id; }
};

const completarRun = z.object({ runId: id }).strict();
export const runCompletar: DefOperacao<z.infer<typeof completarRun>> = {
  id: 'qase.completar_run', servico: 'qase', rotulo: 'Encerrar run no Qase', efeito: 'Marca a run como concluída no Qase. Casos sem resultado continuam sem resultado.', exigeConfirmacao: true, schema: completarRun,
  resumo: p => `Encerrar a run ${p.runId}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/run/${enc(rec.chave)}/${p.runId}`); await ctx.enviar('POST', `/v1/run/${enc(rec.chave)}/${p.runId}/complete`, '{}'); return { id: String(p.runId) }; }
};

export const statusQase = z.enum(['passed', 'failed', 'blocked', 'skipped']);
const resultado = z.object({ casoId: id, status: statusQase, tempoMs: z.number().int().min(0).max(31536000000).optional(), comentario: z.string().max(2000).default(''), stacktrace: z.string().max(4000).optional(), anexos: z.array(z.string().regex(/^[a-f0-9]{16,64}$/)).max(10).optional() }).strict();
const publicar = z.object({ runId: id, resultados: z.array(resultado).min(1).max(200) }).strict();
async function resultadosDaRun(ctx: ContextoServico, rec: Recurso, runId: number) {
  const todos: Record<string, unknown>[] = [];
  for (let off = 0; off < 1000; off += 100) { const p = pagina(await ctx.ler(`/v1/result/${enc(rec.chave)}?run=${runId}&limit=100&offset=${off}`)); todos.push(...p.entities); if (p.entities.length < 100) break; }
  return todos;
}
export const resultadosPublicar: DefOperacao<z.infer<typeof publicar>> = {
  id: 'qase.publicar_resultados', servico: 'qase', rotulo: 'Publicar resultados na run do Qase', efeito: 'Envia o resultado de cada caso (passed, failed, blocked ou skipped) à run. Casos que esta mesma publicação já registrou não são reenviados; depois do envio a run é relida para confirmar.', exigeConfirmacao: true, schema: publicar,
  resumo: p => `Publicar ${p.resultados.length} resultado(s) na run ${p.runId}: ${(['passed', 'failed', 'blocked', 'skipped'] as const).map(s => `${p.resultados.filter(r => r.status === s).length} ${s}`).filter(t => !t.startsWith('0')).join(', ')}`,
  async executar(ctx, rec, p, k) {
    const m = `[${marcador(k)}]`; await ctx.ler(`/v1/run/${enc(rec.chave)}/${p.runId}`);
    const existentes = await resultadosDaRun(ctx, rec, p.runId); const feitos = new Set(existentes.filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    const faltam = p.resultados.filter(r => !feitos.has(r.casoId)); let enviados = 0;
    for (let i = 0; i < faltam.length; i += 200) {
      const lote = faltam.slice(i, i + 200).map(r => ({ case_id: r.casoId, status: r.status, ...(r.tempoMs !== undefined ? { time_ms: r.tempoMs } : {}), comment: `${mascarar(r.comentario)}\n${m}`.trim(), ...(r.stacktrace ? { stacktrace: mascarar(r.stacktrace) } : {}), ...(r.anexos ? { attachments: r.anexos } : {}) }));
      await ctx.enviar('POST', `/v1/result/${enc(rec.chave)}/${p.runId}/bulk`, JSON.stringify({ results: lote })); enviados += lote.length;
    }
    return { id: String(p.runId), detalhes: { enviados, jaRegistrados: p.resultados.length - faltam.length } };
  },
  async reconciliar(ctx, rec, p, k) {
    const m = `[${marcador(k)}]`; const feitos = new Set((await resultadosDaRun(ctx, rec, p.runId)).filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    return p.resultados.every(r => feitos.has(r.casoId)) ? { id: String(p.runId), detalhes: { enviados: 0, jaRegistrados: p.resultados.length } } : null;
  },
  async confirmar(ctx, rec, p, _r, k) {
    const m = `[${marcador(k)}]`; const feitos = new Set((await resultadosDaRun(ctx, rec, p.runId)).filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    return p.resultados.every(r => feitos.has(r.casoId));
  }
};

const anexar = z.object({ arquivo: z.string().min(1).max(500) }).strict();
export const anexoEnviar: DefOperacao<z.infer<typeof anexar>> = {
  id: 'qase.anexar', servico: 'qase', rotulo: 'Enviar anexo ao Qase', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) e devolve o hash para usar em casos e resultados.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Enviar anexo "${path.basename(p.arquivo)}"`,
  async executar(ctx, rec, p, _k, aux) {
    const a = lerAnexo(p.arquivo, aux); const m = multipart('file[]', { nome: a.nome, tipo: a.tipo, dados: a.dados });
    const r = z.object({ result: z.array(z.object({ hash: z.string(), filename: z.string().optional() }).passthrough()) }).passthrough().parse(await ctx.enviar('POST', `/v1/attachment/${enc(rec.chave)}`, m.corpo, m.tipoConteudo));
    return { id: r.result[0]?.hash, detalhes: { arquivo: a.nome, bytes: a.tamanho } };
  }
};
export const operacoesQase = [suiteCriar, casoCriar, casoEditar, casoAssociarTicket, planoCriar, runCriar, runCompletar, resultadosPublicar, anexoEnviar] as unknown as DefOperacao<unknown>[];
