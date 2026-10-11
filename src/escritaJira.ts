import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ErroServico } from './httpServicos.js';
import { textoParaAdf } from './adf.js';
import { multipart } from './multipart.js';
import { mascarar } from './projeto.js';
import { marcador, type DefOperacao, type Remoto, type Auxiliar } from './operacoesTipos.js';
import type { ContextoServico } from './adaptadoresServicos.js';
import type { Recurso } from './espacos.js';

/**
 * Escritas controladas no Jira Cloud (REST v3). Cada operação confere o projeto vinculado antes de escrever, usa só as rotas da
 * lista fechada (rotasEscrita.ts), verifica o efeito relendo o serviço e é idempotente por rótulo/anexo existente.
 * Endpoints: POST /issue, PUT /issue/{key}, POST /issue/{key}/attachments (header X-Atlassian-Token: no-check, campo "file"),
 * GET/POST /issue/{key}/transitions, POST /issueLink, GET /issue/createmeta/{project}/issuetypes (substitui o createmeta antigo).
 */
const chave = /^[A-Z][A-Z0-9_]*-\d+$/;
const idNum = z.string().regex(/^\d{1,12}$/);
const ticket = z.string().regex(chave);
const rotulo = z.string().regex(/^[A-Za-z0-9_.-]{1,50}$/);
const enc = encodeURIComponent;

export async function tiposDeCriacao(ctx: ContextoServico, rec: Recurso) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${enc(rec.chave)}/issuetypes?maxResults=50`)) as { issueTypes?: unknown[]; values?: unknown[] };
  const lista = z.array(z.object({ id: z.union([z.string(), z.number()]).transform(String), name: z.string(), subtask: z.boolean().optional() }).passthrough()).parse(r.issueTypes ?? r.values ?? []);
  return lista.map(t => ({ id: t.id, nome: t.name, subtarefa: t.subtask === true }));
}
export async function camposDoTipo(ctx: ContextoServico, rec: Recurso, tipoId: string) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${enc(rec.chave)}/issuetypes/${enc(tipoId)}?maxResults=100`)) as { fields?: unknown[]; values?: unknown[] };
  return z.array(z.object({ fieldId: z.string().optional(), key: z.string().optional(), name: z.string(), required: z.boolean().optional() }).passthrough()).parse(r.fields ?? r.values ?? []).map(c => ({ id: c.fieldId ?? c.key ?? '', nome: c.name, obrigatorio: c.required === true }));
}
export async function transicoes(ctx: ContextoServico, rec: Recurso, t: string) {
  await doProjeto(ctx, rec, t);
  const r = z.object({ transitions: z.array(z.object({ id: z.string(), name: z.string(), to: z.object({ name: z.string() }).passthrough().optional() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/issue/${enc(t)}/transitions`));
  return r.transitions.map(x => ({ id: x.id, nome: x.name, para: x.to?.name ?? null }));
}
/** Confirma que o ticket pertence ao projeto Jira vinculado (nunca escreve em ticket de outro projeto). */
async function doProjeto(ctx: ContextoServico, rec: Recurso, t: string) {
  const r = z.object({ fields: z.object({ project: z.object({ id: z.union([z.string(), z.number()]).transform(String) }).passthrough(), status: z.object({ name: z.string() }).passthrough().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${enc(t)}?fields=project,status`));
  if (r.fields.project.id !== rec.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return { status: r.fields.status?.name ?? null };
}
const urlTicket = (ctx: ContextoServico, k: string) => `${ctx.instancia}/browse/${k}`;
const achar = async (ctx: ContextoServico, rec: Recurso, rot: string): Promise<Remoto | null> => {
  const jql = `project = ${rec.id} AND labels = "${rot}"`;
  const r = z.object({ issues: z.array(z.object({ key: z.string(), id: z.string() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/search/jql?jql=${enc(jql)}&fields=key&maxResults=1`));
  const i = r.issues[0]; return i ? { id: i.id, chave: i.key, url: urlTicket(ctx, i.key) } : null;
};

const criar = z.object({ tipoId: idNum, resumo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), rotulos: z.array(rotulo).max(10).default([]), origem: ticket.optional(), tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict();
export const criarTicket: DefOperacao<z.infer<typeof criar>> = {
  id: 'jira.criar_ticket', servico: 'jira', rotulo: 'Criar ticket no Jira', efeito: 'Cria um ticket (bug, melhoria ou tarefa) no projeto Jira vinculado e, se informado, o relaciona ao ticket de origem.', exigeConfirmacao: true, schema: criar,
  resumo: p => `Criar ticket "${p.resumo}" (tipo ${p.tipoId})${p.origem ? ` relacionado a ${p.origem}` : ''}`,
  async executar(ctx, rec, p, k) {
    const tipos = await tiposDeCriacao(ctx, rec); const t = tipos.find(x => x.id === p.tipoId);
    if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED'); if (t.subtarefa) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    if (p.origem) await doProjeto(ctx, rec, p.origem);
    const fields = { project: { id: rec.id }, issuetype: { id: p.tipoId }, summary: mascarar(p.resumo), description: textoParaAdf(mascarar(p.descricao)), labels: [...new Set([...p.rotulos, marcador(k)])] };
    const nova = z.object({ id: z.string(), key: z.string() }).passthrough().parse(await ctx.enviar('POST', '/rest/api/3/issue', JSON.stringify({ fields })));
    const r: Remoto = { id: nova.id, chave: nova.key, url: urlTicket(ctx, nova.key), detalhes: { tipo: t.nome } };
    if (p.origem) { try { await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: nova.key }, outwardIssue: { key: p.origem } })); r.detalhes!.vinculo = p.origem; } catch (e) { r.detalhes!.vinculo = 'FALHOU:' + ((e as ErroServico).codigo ?? 'ERRO'); } }
    return r;
  },
  reconciliar: (ctx, rec, _p, k) => achar(ctx, rec, marcador(k)),
  async confirmar(ctx, rec, _p, r) { await doProjeto(ctx, rec, r.chave!); return true; }
};

const anexar = z.object({ ticket, arquivo: z.string().min(1).max(500), nome: z.string().max(150).optional() }).strict();
const tipos: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain', '.log': 'text/plain', '.json': 'application/json', '.html': 'text/html', '.zip': 'application/zip', '.pdf': 'application/pdf' };
/** Lê um arquivo para anexar: só dentro das pastas de evidência do projeto ou de um caminho que a pessoa escolheu no diálogo nativo. */
export function lerAnexo(caminho: string, aux: Auxiliar, limite = 10 * 1024 * 1024) {
  const real = fs.realpathSync(path.resolve(caminho)); const dentro = aux.raizesDeEvidencia.some(r => { try { const rr = fs.realpathSync(r); return real === rr || real.startsWith(rr + path.sep); } catch { return false; } });
  const escolhido = aux.arquivosAutorizados.some(a => { try { return fs.realpathSync(a) === real; } catch { return false; } });
  if (!dentro && !escolhido) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const st = fs.lstatSync(real); if (!st.isFile() || st.nlink !== 1 || st.size === 0 || st.size > limite) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const ext = path.extname(real).toLowerCase(); const tipo = tipos[ext]; if (!tipo || /\.(env|pem|key|pfx|p12)$/i.test(real)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  let dados = fs.readFileSync(real); if (['.txt', '.log', '.json', '.html'].includes(ext)) dados = Buffer.from(mascarar(dados.toString('utf8')), 'utf8');
  return { nome: path.basename(real), tipo, dados, tamanho: dados.length };
}
export const anexarArquivo: DefOperacao<z.infer<typeof anexar>> = {
  id: 'jira.anexar', servico: 'jira', rotulo: 'Anexar arquivo a ticket do Jira', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) como anexo do ticket. Textos têm segredos mascarados; imagens e vídeos são enviados como estão.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Anexar "${path.basename(p.arquivo)}" a ${p.ticket}`,
  async executar(ctx, rec, p, _k, aux) {
    await doProjeto(ctx, rec, p.ticket); const a = lerAnexo(p.arquivo, aux); const nome = p.nome ?? a.nome;
    const m = multipart('file', { nome, tipo: a.tipo, dados: a.dados });
    const r = z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).parse(await ctx.enviar('POST', `/rest/api/3/issue/${enc(p.ticket)}/attachments`, m.corpo, m.tipoConteudo, { 'X-Atlassian-Token': 'no-check' }));
    return { id: r[0]?.id, chave: p.ticket, url: urlTicket(ctx, p.ticket), detalhes: { arquivo: r[0]?.filename ?? nome, bytes: r[0]?.size ?? a.tamanho } };
  },
  async reconciliar(ctx, rec, p, _k) {
    const lista = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).default([]) }).passthrough() }).parse(await ctx.ler(`/rest/api/3/issue/${enc(p.ticket)}?fields=attachment`));
    const nome = p.nome ?? path.basename(p.arquivo); const existe = lista.fields.attachment.find(x => x.filename === nome);
    return existe ? { id: existe.id, chave: p.ticket, url: urlTicket(ctx, p.ticket), detalhes: { arquivo: existe.filename, bytes: existe.size } } : null;
  }
};

const editar = z.object({ ticket, resumo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), adicionarRotulos: z.array(rotulo).max(10).optional() }).strict().refine(p => p.resumo !== undefined || p.descricao !== undefined || (p.adicionarRotulos?.length ?? 0) > 0, 'nenhuma alteração');
export const editarTicket: DefOperacao<z.infer<typeof editar>> = {
  id: 'jira.editar', servico: 'jira', rotulo: 'Atualizar campos de ticket do Jira', efeito: 'Altera resumo, descrição ou adiciona rótulos de um ticket do projeto vinculado. Não remove nada.', exigeConfirmacao: true, schema: editar,
  resumo: p => `Atualizar ${p.ticket}: ${[p.resumo !== undefined && 'resumo', p.descricao !== undefined && 'descrição', p.adicionarRotulos?.length && 'rótulos'].filter(Boolean).join(', ')}`,
  async executar(ctx, rec, p) {
    await doProjeto(ctx, rec, p.ticket); const corpo: Record<string, unknown> = {};
    const fields: Record<string, unknown> = {}; if (p.resumo !== undefined) fields.summary = mascarar(p.resumo); if (p.descricao !== undefined) fields.description = textoParaAdf(mascarar(p.descricao)); if (Object.keys(fields).length) corpo.fields = fields;
    if (p.adicionarRotulos?.length) corpo.update = { labels: p.adicionarRotulos.map(add => ({ add })) };
    await ctx.enviar('PUT', `/rest/api/3/issue/${enc(p.ticket)}`, JSON.stringify(corpo)); return { chave: p.ticket, url: urlTicket(ctx, p.ticket) };
  },
  async confirmar(ctx, rec, p) { const r = z.object({ fields: z.object({ summary: z.string().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${enc(p.ticket)}?fields=summary`)); return p.resumo === undefined || r.fields.summary === mascarar(p.resumo); }
};

const transicionar = z.object({ ticket, transicaoId: idNum }).strict();
export const transicionarTicket: DefOperacao<z.infer<typeof transicionar>> = {
  id: 'jira.transicionar', servico: 'jira', rotulo: 'Mudar o status de ticket do Jira', efeito: 'Executa uma transição de workflow disponível para o ticket. Aprovação de QA e mudança de status são decisões diferentes; isto só ocorre por ação explícita.', exigeConfirmacao: true, schema: transicionar,
  resumo: p => `Mudar status de ${p.ticket} (transição ${p.transicaoId})`,
  async executar(ctx, rec, p) {
    const lista = await transicoes(ctx, rec, p.ticket); const t = lista.find(x => x.id === p.transicaoId); if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    await ctx.enviar('POST', `/rest/api/3/issue/${enc(p.ticket)}/transitions`, JSON.stringify({ transition: { id: p.transicaoId } }));
    return { chave: p.ticket, url: urlTicket(ctx, p.ticket), detalhes: { transicao: t.nome, para: t.para } };
  },
  async confirmar(ctx, rec, p, r) { const s = await doProjeto(ctx, rec, p.ticket); return r.detalhes?.para == null || s.status === r.detalhes.para; }
};

const vincular = z.object({ ticket, comTicket: ticket, tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict().refine(p => p.ticket !== p.comTicket, 'mesmo ticket');
export const vincularTickets: DefOperacao<z.infer<typeof vincular>> = {
  id: 'jira.vincular', servico: 'jira', rotulo: 'Vincular tickets do Jira', efeito: 'Cria um vínculo entre dois tickets do projeto vinculado (por exemplo, defeito e história).', exigeConfirmacao: true, schema: vincular,
  resumo: p => `Vincular ${p.ticket} a ${p.comTicket} (${p.tipoVinculo})`,
  async executar(ctx, rec, p) {
    await doProjeto(ctx, rec, p.ticket); await doProjeto(ctx, rec, p.comTicket);
    await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: p.ticket }, outwardIssue: { key: p.comTicket } })); return { chave: p.ticket, url: urlTicket(ctx, p.ticket) };
  },
  async reconciliar(ctx, _rec, p) {
    const r = z.object({ fields: z.object({ issuelinks: z.array(z.object({ inwardIssue: z.object({ key: z.string() }).passthrough().optional(), outwardIssue: z.object({ key: z.string() }).passthrough().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${enc(p.ticket)}?fields=issuelinks`));
    return r.fields.issuelinks.some(l => l.inwardIssue?.key === p.comTicket || l.outwardIssue?.key === p.comTicket) ? { chave: p.ticket, url: urlTicket(ctx, p.ticket) } : null;
  }
};
export const operacoesJira = [criarTicket, anexarArquivo, editarTicket, transicionarTicket, vincularTickets] as unknown as DefOperacao<unknown>[];
