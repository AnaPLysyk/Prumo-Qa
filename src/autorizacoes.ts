import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { solicitarAprovacao } from './aprovacao.js';
import { escopoDeCapability } from './execucao.js';
import type { Projeto } from './projeto.js';
import type { Delegada } from './execucao.js';

/**
 * Autorizações para trabalho agendado (2.8).
 *
 * Execução de testes: a pessoa aprova UMA vez, pelo mesmo broker nativo do Windows usado nas execuções manuais,
 * um escopo exato (projeto + capability + hash do comando, ambiente e fontes). A autorização guarda esse hash, uma
 * validade, um limite de execuções e pode ser revogada. Se o projeto, o comando ou o ambiente mudarem, o hash muda e a
 * autorização deixa de valer: o trabalho fica BLOCKED. Não existe autorização global nem para "qualquer comando".
 * O broker NÃO é alterado nem contornado: o consentimento acontece aqui, na criação, e é comprovado pelo retorno dele.
 *
 * Publicação no Jira: política separada, restrita a tickets explícitos e tipos de rotina, com validade e limite.
 */
export const MAX_VALIDADE_DIAS = 30;
export const MAX_USOS = 1000;
const execSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), projectId: z.string().max(80), capability: z.string().max(80), ambiente: z.string().max(40),
  scopeHash: z.string().regex(/^[0-9a-f]{64}$/), criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxUsos: z.number().int().min(1).max(MAX_USOS), usos: z.number().int().min(0),
  aprovadoPor: z.string().max(200), metodo: z.string().max(80), revogadaEm: z.string().datetime().nullable()
}).strict();
const pubSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), tickets: z.array(z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/)).min(1).max(20),
  tipos: z.array(z.enum(['smoke', 'regressao', 'validacao-ticket', 'k6'])).min(1).max(4),
  criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxPublicacoes: z.number().int().min(1).max(MAX_USOS), usadas: z.number().int().min(0),
  aprovadoPor: z.string().max(200), revogadaEm: z.string().datetime().nullable()
}).strict();
// 2.9: política de escrita agendada para operações externas explicitamente permitidas (hoje: publicar resultados no Qase).
export const OPERACOES_AGENDAVEIS = ['qase.publicar_resultados'] as const;
const escritaSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), operacao: z.enum(OPERACOES_AGENDAVEIS), runs: z.array(z.number().int().positive()).min(1).max(20),
  criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxUsos: z.number().int().min(1).max(MAX_USOS), usos: z.number().int().min(0), aprovadoPor: z.string().max(200), revogadaEm: z.string().datetime().nullable()
}).strict();
export type PoliticaEscrita = z.infer<typeof escritaSchema>;
export type AutorizacaoExecucao = z.infer<typeof execSchema>;
export type PoliticaPublicacao = z.infer<typeof pubSchema>;
const registro = z.object({ version: z.literal(1), execucoes: z.array(execSchema).max(300), publicacoes: z.array(pubSchema).max(300), escritas: z.array(escritaSchema).max(300).default([]) }).strict();
type Registro = z.infer<typeof registro>;
const ler = (base?: string): Registro => lerLocal<Registro>('autorizacoes.json', registro as unknown as z.ZodType<Registro>, { version: 1, execucoes: [], publicacoes: [], escritas: [] }, base);
const gravar = (r: Registro, base?: string) => gravarLocal('autorizacoes.json', registro.parse(r), base);
export const listarAutorizacoes = (base?: string) => ler(base);
const validade = (dias: number, agora: Date) => { if (!Number.isFinite(dias) || dias <= 0 || dias > MAX_VALIDADE_DIAS) throw new Error('AUTH_VALIDITY_INVALID'); return new Date(agora.getTime() + dias * 86400000).toISOString(); };
const vigente = (validaAte: string, revogada: string | null, agora: Date) => !revogada && Date.parse(validaAte) > agora.getTime();

export type Solicitador = typeof solicitarAprovacao;
export type EscopoAutorizado = { scopeHash: string; command: string };
/** Pede o consentimento humano nativo para este escopo exato e só então grava a autorização. */
export async function autorizarEscopo(p: Projeto, espacoId: string, capability: string, ambiente: string, escopo: EscopoAutorizado, opcoes: { dias: number; maxUsos: number }, base?: string, solicitar: Solicitador = solicitarAprovacao, agora = new Date()): Promise<AutorizacaoExecucao> {
  if (!Number.isInteger(opcoes.maxUsos) || opcoes.maxUsos < 1 || opcoes.maxUsos > MAX_USOS) throw new Error('AUTH_USES_INVALID');
  const validaAte = validade(opcoes.dias, agora);
  const aprovado = await solicitar({ projectId: p.manifesto.id, root: p.raiz, capability, scopeHash: escopo.scopeHash, command: escopo.command, expiresAt: new Date(agora.getTime() + 120000).toISOString() });
  if (!aprovado || aprovado.scopeHash !== escopo.scopeHash) throw new Error('HUMAN_APPROVAL_REQUIRED');
  const a: AutorizacaoExecucao = { id: randomUUID(), espacoId, projectId: p.manifesto.id, capability, ambiente, scopeHash: escopo.scopeHash, criadaEm: agora.toISOString(), validaAte, maxUsos: opcoes.maxUsos, usos: 0, aprovadoPor: aprovado.subject, metodo: aprovado.method, revogadaEm: null };
  const r = ler(base); if (r.execucoes.length >= 300) throw new Error('AUTH_LIMIT');
  // Uma autorização vigente por (espaço, capability, ambiente): a nova substitui (revoga) a anterior, sem acumular poderes.
  for (const x of r.execucoes) if (x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.execucoes.push(execSchema.parse(a)); gravar(r, base); return a;
}
export async function autorizarExecucao(p: Projeto, espacoId: string, capability: string, ambiente: string, opcoes: { dias: number; maxUsos: number }, base?: string, solicitar: Solicitador = solicitarAprovacao, agora = new Date()) {
  return autorizarEscopo(p, espacoId, capability, ambiente, await escopoDeCapability(p, capability), opcoes, base, solicitar, agora);
}
export function revogarExecucao(id: string, base?: string, agora = new Date()) { const r = ler(base); const a = r.execucoes.find(x => x.id === id); if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravar(r, base); return a; }
/** Estado legível para a interface, sem expor hash completo. */
export function estadoExecucao(a: AutorizacaoExecucao, agora = new Date()): 'VIGENTE' | 'EXPIRADA' | 'REVOGADA' | 'ESGOTADA' {
  return a.revogadaEm ? 'REVOGADA' : Date.parse(a.validaAte) <= agora.getTime() ? 'EXPIRADA' : a.usos >= a.maxUsos ? 'ESGOTADA' : 'VIGENTE';
}
/** Delegada para o executor. Consome um uso de forma atômica ao reconhecer o escopo; qualquer divergência devolve null (BLOCKED). */
export function delegadaPara(espacoId: string, ambiente: string, base?: string, agora = () => new Date()): Delegada {
  return async ({ scopeHash, capability }) => {
    const r = ler(base); const t = agora();
    const a = r.execucoes.find(x => x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && x.scopeHash === scopeHash && estadoExecucao(x, t) === 'VIGENTE');
    if (!a) return null; a.usos += 1; gravar(r, base);
    return { subject: a.aprovadoPor, method: 'delegada:' + a.metodo, scopeHash, at: t.toISOString() };
  };
}

export function criarPoliticaPublicacao(espacoId: string, d: { tickets: string[]; tipos: PoliticaPublicacao['tipos']; dias: number; maxPublicacoes: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaPublicacao {
  const p = pubSchema.parse({ id: randomUUID(), espacoId, tickets: [...new Set(d.tickets.map(t => t.toUpperCase()))], tipos: d.tipos, criadaEm: agora.toISOString(), validaAte: validade(d.dias, agora), maxPublicacoes: d.maxPublicacoes, usadas: 0, aprovadoPor, revogadaEm: null });
  const r = ler(base); if (r.publicacoes.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.publicacoes) if (x.espacoId === espacoId && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.publicacoes.push(p); gravar(r, base); return p;
}
export function revogarPublicacao(id: string, base?: string, agora = new Date()) { const r = ler(base); const a = r.publicacoes.find(x => x.id === id); if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravar(r, base); return a; }
export function estadoPublicacao(p: PoliticaPublicacao, agora = new Date()) { return p.revogadaEm ? 'REVOGADA' : Date.parse(p.validaAte) <= agora.getTime() ? 'EXPIRADA' : p.usadas >= p.maxPublicacoes ? 'ESGOTADA' : 'VIGENTE'; }
/** Verifica (sem consumir) se a política cobre ticket e tipo. */
export function politicaCobre(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  return ler(base).publicacoes.find(p => p.espacoId === espacoId && estadoPublicacao(p, agora) === 'VIGENTE' && p.tickets.includes(ticket) && (p.tipos as string[]).includes(tipo)) ?? null;
}
/** Consome uma publicação da política que cobre ticket+tipo. Retorna null se nenhuma cobrir. */
export function consumirPublicacao(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  const r = ler(base); const p = r.publicacoes.find(x => x.espacoId === espacoId && estadoPublicacao(x, agora) === 'VIGENTE' && x.tickets.includes(ticket) && (x.tipos as string[]).includes(tipo));
  if (!p) return null; p.usadas += 1; gravar(r, base); return p;
}
/** Devolve o uso quando a publicação falhou antes de chegar ao Jira (não houve efeito remoto). */
export function devolverPublicacao(id: string, base?: string) { const r = ler(base); const p = r.publicacoes.find(x => x.id === id); if (p && p.usadas > 0) { p.usadas -= 1; gravar(r, base); } }

export const estadoEscrita = (p: PoliticaEscrita, agora = new Date()) => p.revogadaEm ? 'REVOGADA' : Date.parse(p.validaAte) <= agora.getTime() ? 'EXPIRADA' : p.usos >= p.maxUsos ? 'ESGOTADA' : 'VIGENTE';
export function criarPoliticaEscrita(espacoId: string, d: { operacao: PoliticaEscrita['operacao']; runs: number[]; dias: number; maxUsos: number }, aprovadoPor: string, base?: string, agora = new Date()): PoliticaEscrita {
  const p = escritaSchema.parse({ id: randomUUID(), espacoId, operacao: d.operacao, runs: [...new Set(d.runs)], criadaEm: agora.toISOString(), validaAte: validade(d.dias, agora), maxUsos: d.maxUsos, usos: 0, aprovadoPor, revogadaEm: null });
  const r = ler(base); if (r.escritas.length >= 300) throw new Error('AUTH_LIMIT');
  for (const x of r.escritas) if (x.espacoId === espacoId && x.operacao === p.operacao && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.escritas.push(p); gravar(r, base); return p;
}
export function revogarPoliticaEscrita(id: string, base?: string, agora = new Date()) { const r = ler(base); const a = r.escritas.find(x => x.id === id); if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravar(r, base); return a; }
/** Consome um uso se existir política vigente que cubra a operação e a run. Sem política: null (a operação agendada fica BLOQUEADA). */
export function consumirPoliticaEscrita(espacoId: string, operacao: string, run: number, base?: string, agora = new Date()) {
  const r = ler(base); const p = r.escritas.find(x => x.espacoId === espacoId && x.operacao === operacao && estadoEscrita(x, agora) === 'VIGENTE' && x.runs.includes(run)); if (!p) return null; p.usos += 1; gravar(r, base); return p;
}
