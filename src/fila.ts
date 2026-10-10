import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { tiposRotina } from './agenda.js';

/**
 * Fila persistente de trabalhos (2.8). Adapta de QA Orchestrator (fila/worker): reivindicação única,
 * heartbeat, recuperação de interrompidos, retentativa com espera crescente e idempotência por chave.
 * Escrita síncrona e atômica; o worker é o único escritor (travado em worker.ts).
 */
export const estadosTrabalho = ['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO'] as const;
export const resultadoStatus = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'] as const;
const tentativa = z.object({ n: z.number().int(), inicio: z.string().datetime(), fim: z.string().datetime().nullable(), estado: z.enum(['EXECUTANDO', 'CONCLUIDA', 'ERRO', 'INTERROMPIDA']), codigo: z.string().max(80).optional() }).strict();
export const resultadoSchema = z.object({
  status: z.enum(resultadoStatus), motivo: z.string().max(600),
  contagem: z.object({ pass: z.number().int(), fail: z.number().int(), blocked: z.number().int(), notRun: z.number().int() }).strict().optional(),
  evidenciaId: z.string().uuid().optional(), ticket: z.string().max(40).optional(), detalhes: z.string().max(4000).optional()
}).strict();
export type ResultadoTrabalho = z.infer<typeof resultadoSchema>;
export const trabalhoSchema = z.object({
  id: z.string().uuid(), chave: z.string().min(1).max(200), rotinaId: z.string().uuid(), espacoId: z.string().uuid(),
  tipo: z.enum(tiposRotina), capability: z.string().max(80).optional(), ambiente: z.string().max(40), ticket: z.string().max(40).optional(),
  origem: z.enum(['AGENDA', 'MANUAL']), slot: z.string().datetime().nullable(),
  estado: z.enum(estadosTrabalho), tentativas: z.number().int(), maxTentativas: z.number().int().min(1).max(5),
  criadoEm: z.string().datetime(), disponivelEm: z.string().datetime(), iniciadoEm: z.string().datetime().nullable(), heartbeat: z.string().datetime().nullable(),
  terminadoEm: z.string().datetime().nullable(), resultado: resultadoSchema.nullable(), erro: z.string().max(120).nullable(),
  log: z.array(tentativa).max(10),
  jira: z.object({ estado: z.enum(['NAO_APLICAVEL', 'PREPARADO', 'PENDENTE', 'PUBLICADO', 'FALHA', 'BLOQUEADO']), comentarioId: z.string().max(100).optional(), codigo: z.string().max(80).optional() }).strict().default({ estado: 'NAO_APLICAVEL' })
}).strict();
export type Trabalho = z.infer<typeof trabalhoSchema>;
const registro = z.object({ version: z.literal(1), trabalhos: z.array(trabalhoSchema).max(1500) }).strict();
type Registro = z.infer<typeof registro>;
const LIMITE = 1500; const ESPERA_BASE_MS = 30000;

const ler = (base?: string): Registro => lerLocal<Registro>('fila.json', registro as unknown as z.ZodType<Registro>, { version: 1, trabalhos: [] }, base);
const gravar = (r: Registro, base?: string) => {
  // Poda apenas o histórico encerrado mais antigo; nunca descarta trabalho pendente ou em execução.
  if (r.trabalhos.length > LIMITE) {
    const ativos = r.trabalhos.filter(t => t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO');
    const finais = r.trabalhos.filter(t => !(t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO')).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).slice(-(LIMITE - ativos.length));
    r.trabalhos = [...finais, ...ativos];
  }
  gravarLocal('fila.json', registro.parse(r), base);
};
export const listarTrabalhos = (base?: string) => ler(base).trabalhos;
export function obterTrabalho(id: string, base?: string) { const t = ler(base).trabalhos.find(x => x.id === id); if (!t) throw new Error('JOB_NOT_FOUND'); return t; }

export type NovoTrabalho = { chave: string; rotinaId: string; espacoId: string; tipo: Trabalho['tipo']; capability?: string; ambiente: string; ticket?: string; origem: 'AGENDA' | 'MANUAL'; slot: string | null; maxTentativas?: number };
/** Idempotente: a mesma chave nunca vira dois trabalhos. Retorna `criado:false` se já existir. */
export function enfileirar(n: NovoTrabalho, base?: string, agora = new Date()): { trabalho: Trabalho; criado: boolean } {
  const r = ler(base); const existente = r.trabalhos.find(t => t.chave === n.chave); if (existente) return { trabalho: existente, criado: false };
  if (r.trabalhos.filter(t => t.estado === 'PENDENTE').length >= 200) throw new Error('QUEUE_FULL');
  if (n.origem === 'AGENDA' && r.trabalhos.some(t => t.rotinaId === n.rotinaId && (t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO'))) throw new Error('QUEUE_ALREADY_ACTIVE');
  const iso = agora.toISOString();
  const t: Trabalho = trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PENDENTE', tentativas: 0, maxTentativas: n.maxTentativas ?? 3, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: null, resultado: null, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } });
  r.trabalhos.push(t); gravar(r, base); return { trabalho: t, criado: true };
}
/** Registra um slot que não será executado (PERDIDO/SUBSTITUIDO) sem confundir com execução. Idempotente pela chave. */
export function registrarPerdido(n: NovoTrabalho, motivo: string, base?: string, agora = new Date()) {
  const r = ler(base); if (r.trabalhos.some(t => t.chave === n.chave)) return;
  const iso = agora.toISOString();
  r.trabalhos.push(trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PERDIDO', tentativas: 0, maxTentativas: 1, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: iso, resultado: { status: 'NOT_RUN', motivo }, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } }));
  gravar(r, base);
}
/** Pega o próximo trabalho elegível. No máximo UM em execução por projeto e UM no total (concorrência 1). */
export function reivindicar(base?: string, agora = new Date(), bloquear: (t: Trabalho) => boolean = () => false): Trabalho | null {
  const r = ler(base); if (r.trabalhos.some(t => t.estado === 'EXECUTANDO')) return null;
  const t = r.trabalhos.filter(x => x.estado === 'PENDENTE' && Date.parse(x.disponivelEm) <= agora.getTime() && !bloquear(x)).sort((a, b) => a.disponivelEm.localeCompare(b.disponivelEm))[0];
  if (!t) return null;
  const iso = agora.toISOString(); t.estado = 'EXECUTANDO'; t.tentativas += 1; t.iniciadoEm = iso; t.heartbeat = iso; t.terminadoEm = null; t.erro = null;
  t.log.push({ n: t.tentativas, inicio: iso, fim: null, estado: 'EXECUTANDO' }); t.log = t.log.slice(-10); gravar(r, base); return t;
}
function mudar(id: string, fn: (t: Trabalho) => void, base?: string) { const r = ler(base); const t = r.trabalhos.find(x => x.id === id); if (!t) throw new Error('JOB_NOT_FOUND'); fn(t); trabalhoSchema.parse(t); gravar(r, base); return t; }
export const batimento = (id: string, base?: string, agora = new Date()) => mudar(id, t => { if (t.estado === 'EXECUTANDO') t.heartbeat = agora.toISOString(); }, base);
const fecharTentativa = (t: Trabalho, estado: 'CONCLUIDA' | 'ERRO' | 'INTERROMPIDA', iso: string, codigo?: string) => { const a = t.log.at(-1); if (a && a.fim === null) { a.fim = iso; a.estado = estado; if (codigo) a.codigo = codigo; } };
export const concluir = (id: string, resultado: ResultadoTrabalho, base?: string, agora = new Date()) => mudar(id, t => { const iso = agora.toISOString(); t.estado = 'CONCLUIDO'; t.resultado = resultadoSchema.parse(resultado); t.terminadoEm = iso; t.heartbeat = null; fecharTentativa(t, 'CONCLUIDA', iso); }, base);
/**
 * Falha de INFRAESTRUTURA (rede, serviço indisponível, runner ausente): retenta com espera crescente até o limite.
 * Falha de teste NÃO passa por aqui: é um resultado (FAIL), registrado em `concluir`, e não se repete.
 */
export const falharInfra = (id: string, codigo: string, motivo: string, retentavel: boolean, base?: string, agora = new Date()) => mudar(id, t => {
  const iso = agora.toISOString(); fecharTentativa(t, 'ERRO', iso, codigo); t.heartbeat = null;
  if (retentavel && t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = codigo; t.disponivelEm = new Date(agora.getTime() + ESPERA_BASE_MS * 2 ** (t.tentativas - 1)).toISOString(); return; }
  t.estado = 'ERRO'; t.erro = codigo; t.terminadoEm = iso; t.resultado = resultadoSchema.parse({ status: 'ERRO_INFRA', motivo: motivo.slice(0, 600) });
}, base);
export const cancelar = (id: string, base?: string, agora = new Date()) => mudar(id, t => { if (t.estado !== 'PENDENTE') throw new Error('JOB_NOT_CANCELABLE'); t.estado = 'CANCELADO'; t.terminadoEm = agora.toISOString(); t.resultado = { status: 'NOT_RUN', motivo: 'Cancelado pela pessoa antes de iniciar.' }; }, base);
export const definirJira = (id: string, jira: Trabalho['jira'], base?: string) => mudar(id, t => { t.jira = trabalhoSchema.shape.jira.parse(jira); }, base);
/** Início do worker: trabalho EXECUTANDO sem batimento recente foi interrompido (fechamento, queda, suspensão). Nunca vira PASS. */
export function recuperarInterrompidos(base?: string, agora = new Date(), limiteMs = 120000) {
  const r = ler(base); let n = 0; const iso = agora.toISOString();
  for (const t of r.trabalhos) {
    if (t.estado !== 'EXECUTANDO') continue; if (t.heartbeat && agora.getTime() - Date.parse(t.heartbeat) < limiteMs) continue;
    fecharTentativa(t, 'INTERROMPIDA', iso, 'INTERRUPTED'); t.heartbeat = null; n++;
    if (t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = 'INTERRUPTED'; t.disponivelEm = iso; }
    else { t.estado = 'ERRO'; t.erro = 'INTERRUPTED'; t.terminadoEm = iso; t.resultado = { status: 'ERRO_INFRA', motivo: 'Execução interrompida (aplicativo fechado, queda ou suspensão) e sem tentativas restantes.' }; }
  }
  if (n) gravar(r, base); return n;
}
