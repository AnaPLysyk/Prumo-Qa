/** Formato de uma rotina agendada: tipos, ambientes, frequência (único, intervalo, diário, semanal), fuso e k6. */
import { z } from 'zod';

/**
 * Agenda de rotinas (2.8). Conceitos adaptados do scheduler do QA Orchestrator (agenda, ancoragem, fuso e
 * idempotência por "slot"), reescritos para o núcleo atual. Não executa nada: só diz QUANDO uma rotina vence.
 * Um "slot" é o instante UTC exato em que a rotina deveria rodar; ele é a chave de idempotência da fila.
 */
export const tiposRotina = ['consulta-jira', 'smoke', 'regressao', 'validacao-ticket', 'analise-mudancas', 'k6', 'run-qase'] as const;

export type TipoRotina = typeof tiposRotina[number];

export const ambientes = ['local', 'teste', 'homologacao', 'producao'] as const;

export const hora = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const frequenciaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('unico'), em: z.string().datetime({ offset: true }) }).strict(),
  z.object({ tipo: z.literal('intervalo'), minutos: z.number().int().min(1).max(60 * 24 * 31) }).strict(),
  z.object({ tipo: z.literal('diario'), hora }).strict(),
  z.object({ tipo: z.literal('semanal'), dias: z.array(z.number().int().min(0).max(6)).min(1).max(7), hora }).strict()
]);

export type Frequencia = z.infer<typeof frequenciaSchema>;

export const fuso = z.string().min(1).max(64).refine(valor => { try { new Intl.DateTimeFormat('en-US', { timeZone: valor }).format(new Date()); return true; } catch { return false; } }, 'fuso inválido');

export const ticket = z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/);

export const identificador = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);

export const caminhoRelativo = z.string().min(1).max(300);

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

export const evento = z.object({ at: z.string().datetime(), acao: z.enum(['CRIADA', 'EDITADA', 'PAUSADA', 'RETOMADA', 'DESATIVADA', 'ATIVADA', 'CONCLUIDA']) }).strict();

export const rotinaSchema = dadosRotinaSchema.innerType().extend({
  id: z.string().uuid(), estado: z.enum(['ATIVA', 'PAUSADA', 'DESATIVADA', 'CONCLUIDA']),
  ancora: z.string().datetime(), ultimoSlot: z.string().datetime().nullable(),
  criadaEm: z.string().datetime(), historico: z.array(evento).max(200)
}).strict();

export type Rotina = z.infer<typeof rotinaSchema>;

export const registro = z.object({ version: z.literal(1), pausaGlobal: z.boolean(), rotinas: z.array(rotinaSchema).max(200) }).strict();

export type Registro = z.infer<typeof registro>;

export type SlotVencido = { slot: number; executar: boolean; motivo?: 'PERDIDO' | 'SUBSTITUIDO' };
