import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';

/**
 * Agenda de rotinas (2.8). Conceitos adaptados do scheduler do QA Orchestrator (agenda, ancoragem, fuso e
 * idempotência por "slot"), reescritos para o núcleo atual. Não executa nada: só diz QUANDO uma rotina vence.
 * Um "slot" é o instante UTC exato em que a rotina deveria rodar; ele é a chave de idempotência da fila.
 */
export const tiposRotina = ['consulta-jira', 'smoke', 'regressao', 'validacao-ticket', 'analise-mudancas', 'k6', 'run-qase'] as const;
export type TipoRotina = typeof tiposRotina[number];
export const ambientes = ['local', 'teste', 'homologacao', 'producao'] as const;

const hora = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const frequenciaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('unico'), em: z.string().datetime({ offset: true }) }).strict(),
  z.object({ tipo: z.literal('intervalo'), minutos: z.number().int().min(1).max(60 * 24 * 31) }).strict(),
  z.object({ tipo: z.literal('diario'), hora }).strict(),
  z.object({ tipo: z.literal('semanal'), dias: z.array(z.number().int().min(0).max(6)).min(1).max(7), hora }).strict()
]);
export type Frequencia = z.infer<typeof frequenciaSchema>;

const fuso = z.string().min(1).max(64).refine(valor => { try { new Intl.DateTimeFormat('en-US', { timeZone: valor }).format(new Date()); return true; } catch { return false; } }, 'fuso inválido');
const ticket = z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/);
const identificador = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const caminhoRelativo = z.string().min(1).max(300);

export const k6Schema = z.object({
  script: caminhoRelativo, alvo: z.string().url().max(300),
  usuarios: z.number().int().min(1).max(50), duracaoSegundos: z.number().int().min(1).max(600)
}).strict();

export const dadosRotinaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  espacoId: z.string().uuid(),
  tipo: z.enum(tiposRotina),
  capability: identificador.optional(),
  ambiente: z.enum(ambientes).default('local'),
  frequencia: frequenciaSchema,
  fuso: fuso,
  politicaPerdido: z.enum(['PULAR', 'EXECUTAR_UMA_VEZ']).default('PULAR'),
  toleranciaMinutos: z.number().int().min(0).max(1440).default(10),
  ticket: ticket.optional(),
  k6: k6Schema.optional(),
  operacaoJira: z.enum(['tickets', 'ticket']).default('tickets'),
  runLocalId: z.string().uuid().optional()
}).strict().superRefine((d, ctx) => {
  if (d.tipo === 'run-qase' && !d.runLocalId) ctx.addIssue({ code: 'custom', message: 'run obrigatória', path: ['runLocalId'] });
  const precisaCapability = ['smoke', 'regressao', 'validacao-ticket'].includes(d.tipo);
  if (precisaCapability && d.tipo !== 'validacao-ticket' && !d.capability) ctx.addIssue({ code: 'custom', message: 'capability obrigatória', path: ['capability'] });
  if (d.tipo === 'validacao-ticket' && !d.ticket) ctx.addIssue({ code: 'custom', message: 'ticket obrigatório', path: ['ticket'] });
  if (d.tipo === 'k6' && !d.k6) ctx.addIssue({ code: 'custom', message: 'configuração k6 obrigatória', path: ['k6'] });
  if (d.tipo === 'consulta-jira' && d.operacaoJira === 'ticket' && !d.ticket) ctx.addIssue({ code: 'custom', message: 'ticket obrigatório', path: ['ticket'] });
});
export type DadosRotina = z.input<typeof dadosRotinaSchema>;

const evento = z.object({ at: z.string().datetime(), acao: z.enum(['CRIADA', 'EDITADA', 'PAUSADA', 'RETOMADA', 'DESATIVADA', 'ATIVADA', 'CONCLUIDA']) }).strict();
export const rotinaSchema = dadosRotinaSchema.innerType().extend({
  id: z.string().uuid(), estado: z.enum(['ATIVA', 'PAUSADA', 'DESATIVADA', 'CONCLUIDA']),
  ancora: z.string().datetime(), ultimoSlot: z.string().datetime().nullable(),
  criadaEm: z.string().datetime(), historico: z.array(evento).max(200)
}).strict();
export type Rotina = z.infer<typeof rotinaSchema>;
const registro = z.object({ version: z.literal(1), pausaGlobal: z.boolean(), rotinas: z.array(rotinaSchema).max(200) }).strict();
type Registro = z.infer<typeof registro>;

// ---- Tempo e fuso ----
function desvioNoFuso(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!) - Math.floor(instante / 1000) * 1000;
}
/** Converte data+hora de parede no fuso para o instante UTC. Horário repetido (fim do verão): primeira ocorrência. Horário inexistente (salto): avança para depois do salto. */
export function instanteLocal(ano: number, mes: number, dia: number, hhmm: string, zona: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const parede = Date.UTC(ano, mes - 1, dia, h, m, 0);
  const candidatos = [...new Set([desvioNoFuso(parede - 86400000, zona), desvioNoFuso(parede + 86400000, zona)])].map(o => parede - o);
  const validos = candidatos.filter(c => c + desvioNoFuso(c, zona) === parede);
  return validos.length ? Math.min(...validos) : Math.max(...candidatos);
}
function dataNoFuso(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), semana: dias.indexOf(String(p.weekday)) };
}

/** Slots (instantes UTC) estritamente depois de `depois` e até `ate`, em ordem. Limitado para nunca gerar laço longo. */
export function slotsEntre(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora'>, depois: number, ate: number, limite = 2000): number[] {
  const f = r.frequencia; const saida: number[] = [];
  if (ate <= depois) return saida;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); if (t > depois && t <= ate) saida.push(t); return saida; }
  if (f.tipo === 'intervalo') {
    const passo = f.minutos * 60000; const ancora = Date.parse(r.ancora);
    let k = Math.max(1, Math.floor((depois - ancora) / passo) + 1);
    for (; saida.length < limite; k++) { const t = ancora + k * passo; if (t > ate) break; if (t > depois) saida.push(t); }
    return saida;
  }
  // diário e semanal: percorre dias de parede no fuso (a partir de um dia antes, por causa de deslocamentos de fuso)
  const inicio = dataNoFuso(depois - 86400000, r.fuso);
  let dia = Date.UTC(inicio.ano, inicio.mes - 1, inicio.dia);
  for (let i = 0; i < 4000 && saida.length < limite; i++, dia += 86400000) {
    const d = new Date(dia); const semana = d.getUTCDay();
    if (f.tipo === 'semanal' && !f.dias.includes(semana)) continue;
    const t = instanteLocal(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), f.hora, r.fuso);
    if (t > ate + 86400000 * 2) break;
    if (t > depois && t <= ate) saida.push(t);
    if (t > ate && dia > ate + 86400000 * 2) break;
  }
  return [...new Set(saida)].sort((a, b) => a - b);
}
export function proximoSlot(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora' | 'ultimoSlot'>, agora: number): number | null {
  const base = Math.max(r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora), Date.parse(r.ancora));
  const tentativa = (janela: number) => slotsEntre(r, Math.max(base, agora - 1), agora + janela, 1)[0] ?? null;
  const f = r.frequencia;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); return r.ultimoSlot && Date.parse(r.ultimoSlot) >= t ? null : t; }
  // Se existe slot vencido e ainda não tratado, ele é o "próximo" (será tratado pela política de perdidos).
  const vencido = slotsEntre(r, base, agora, 1)[0];
  if (vencido !== undefined) return vencido;
  return tentativa(f.tipo === 'intervalo' ? f.minutos * 60000 + 1000 : 8 * 86400000);
}

// ---- Persistência ----
const ler = (base?: string): Registro => lerLocal<Registro>('agenda.json', registro as unknown as z.ZodType<Registro>, { version: 1, pausaGlobal: false, rotinas: [] }, base);
const gravar = (r: Registro, base?: string) => gravarLocal('agenda.json', registro.parse(r), base);
const ev = (r: Rotina, acao: z.infer<typeof evento>['acao']) => { r.historico.push({ at: new Date().toISOString(), acao }); r.historico = r.historico.slice(-200); };

export const listarRotinas = (base?: string) => ler(base).rotinas;
export const pausaGlobal = (base?: string) => ler(base).pausaGlobal;
export function obterRotina(id: string, base?: string) { const r = ler(base).rotinas.find(x => x.id === id); if (!r) throw new Error('SCHEDULE_NOT_FOUND'); return r; }
export function criarRotina(dados: DadosRotina, base?: string, agora = new Date()): Rotina {
  const d = dadosRotinaSchema.parse(dados); const reg = ler(base);
  if (reg.rotinas.length >= 200) throw new Error('SCHEDULE_LIMIT');
  if (d.frequencia.tipo === 'unico' && Date.parse(d.frequencia.em) <= agora.getTime()) throw new Error('SCHEDULE_IN_THE_PAST');
  const r: Rotina = { ...d, id: randomUUID(), estado: 'ATIVA', ancora: agora.toISOString(), ultimoSlot: null, criadaEm: agora.toISOString(), historico: [] };
  ev(r, 'CRIADA'); reg.rotinas.push(rotinaSchema.parse(r)); gravar(reg, base); return r;
}
function alterar(id: string, fn: (r: Rotina) => void, base?: string) {
  const reg = ler(base); const r = reg.rotinas.find(x => x.id === id); if (!r) throw new Error('SCHEDULE_NOT_FOUND');
  fn(r); rotinaSchema.parse(r); gravar(reg, base); return r;
}
export function editarRotina(id: string, dados: DadosRotina, base?: string, agora = new Date()) {
  const d = dadosRotinaSchema.parse(dados);
  return alterar(id, r => {
    if (d.espacoId !== r.espacoId) throw new Error('SCHEDULE_PROJECT_IMMUTABLE');
    Object.assign(r, d); r.ancora = agora.toISOString(); r.ultimoSlot = null; if (r.estado === 'CONCLUIDA') r.estado = 'ATIVA'; ev(r, 'EDITADA');
  }, base);
}
export const pausarRotina = (id: string, base?: string) => alterar(id, r => { if (r.estado === 'ATIVA') { r.estado = 'PAUSADA'; ev(r, 'PAUSADA'); } }, base);
export const retomarRotina = (id: string, base?: string, agora = new Date()) => alterar(id, r => { if (r.estado === 'PAUSADA' || r.estado === 'DESATIVADA') { r.estado = 'ATIVA'; r.ultimoSlot = agora.toISOString(); ev(r, 'RETOMADA'); } }, base);
export const desativarRotina = (id: string, base?: string) => alterar(id, r => { r.estado = 'DESATIVADA'; ev(r, 'DESATIVADA'); }, base);
export function excluirRotina(id: string, base?: string) { const reg = ler(base); if (!reg.rotinas.some(r => r.id === id)) throw new Error('SCHEDULE_NOT_FOUND'); reg.rotinas = reg.rotinas.filter(r => r.id !== id); gravar(reg, base); return { excluida: true }; }
export function definirPausaGlobal(pausado: boolean, base?: string) { const reg = ler(base); reg.pausaGlobal = pausado; gravar(reg, base); return pausado; }
/** Marca o slot tratado (executado, pulado ou perdido). Rotina única conclui. */
export function marcarSlot(id: string, slot: number, base?: string) {
  return alterar(id, r => { r.ultimoSlot = new Date(Math.max(slot, r.ultimoSlot ? Date.parse(r.ultimoSlot) : 0)).toISOString(); if (r.frequencia.tipo === 'unico') { r.estado = 'CONCLUIDA'; ev(r, 'CONCLUIDA'); } }, base);
}

export type SlotVencido = { slot: number; executar: boolean; motivo?: 'PERDIDO' | 'SUBSTITUIDO' };
/**
 * Decide o que fazer com os slots vencidos desde o último tratado. Política:
 * - dentro da tolerância: executa;
 * - fora da tolerância e PULAR: registra PERDIDO (nunca executa "atrasado" sem decisão);
 * - EXECUTAR_UMA_VEZ: executa só o mais recente; os demais ficam SUBSTITUIDO.
 */
export function slotsVencidos(r: Rotina, agora: number): SlotVencido[] {
  if (r.estado !== 'ATIVA') return [];
  const base = r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora);
  const slots = slotsEntre(r, base, agora, 500); if (!slots.length) return [];
  const tolerancia = r.toleranciaMinutos * 60000; const ultimo = slots[slots.length - 1]!;
  return slots.map(slot => {
    const atrasado = agora - slot > tolerancia;
    if (r.politicaPerdido === 'EXECUTAR_UMA_VEZ') return slot === ultimo ? { slot, executar: true } : { slot, executar: false, motivo: 'SUBSTITUIDO' as const };
    return atrasado ? { slot, executar: false, motivo: 'PERDIDO' as const } : { slot, executar: true };
  });
}
