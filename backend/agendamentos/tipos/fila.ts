/** Formato de um trabalho da fila (estados, tentativas, resultado, Jira) e os limites da fila. */
import { z } from 'zod';
import { tiposRotina } from './rotina.js';

/**
 * Fila persistente de trabalhos. Adapta do QA Orchestrator (fila/worker): reivindicação única,
 * heartbeat, recuperação de interrompidos, retentativa com espera crescente e idempotência por chave.
 * Escrita síncrona e atômica; o worker é o único escritor (travado em worker.ts).
 */
const estadosTrabalho = ['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO'] as const;

const resultadoStatus = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'] as const;

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

export const registro = z.object({ version: z.literal(1), trabalhos: z.array(trabalhoSchema).max(1500) }).strict();

export type Registro = z.infer<typeof registro>;

export const LIMITE = 1500;

export const ESPERA_BASE_MS = 30000;

export type NovoTrabalho = { chave: string; rotinaId: string; espacoId: string; tipo: Trabalho['tipo']; capability?: string; ambiente: string; ticket?: string; origem: 'AGENDA' | 'MANUAL'; slot: string | null; maxTentativas?: number };
