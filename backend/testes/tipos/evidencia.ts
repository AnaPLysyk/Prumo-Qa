/** Evidências e histórico de execuções — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";

// ── evidencia ──
const statusSchema = z.enum(['PASS','FAIL','BLOCKED','NOT_RUN']);

export type Status = z.infer<typeof statusSchema>;

export const casoResultadoSchema = z.object({ id:z.string().min(1).max(100), status:statusSchema, evidence:z.string().min(1).max(4000) }).strict();

export const resultadoRunnerSchema = z.object({ jobId:z.string().uuid(), cases:z.array(casoResultadoSchema).max(1000) }).strict();

export const evidenciaSchema = z.object({
  kind:z.literal('execution_evidence'), jobId:z.string().uuid(), projectId:z.string(), rootHash:z.string(),
  manifestHash:z.string(), scopeHash:z.string().nullable(), capability:z.string(), status:statusSchema,
  reason:z.string(), startedAt:z.string(), endedAt:z.string(), executed:z.boolean(), exitCode:z.number().int().nullable(),
  command:z.unknown(), approval:z.unknown(), cases:z.array(casoResultadoSchema),
  stdout:z.string(), stderr:z.string(), logSha256:z.string(), resultArtifact:z.unknown(),
  evidenceScope:z.enum(['round','individual']), provenance:z.literal('local-process')
}).strict();

export type Evidencia = z.infer<typeof evidenciaSchema>;

// ── historicoDeExecucoes ──
/**
 * Histórico centralizado: une os trabalhos da fila (execuções, consultas, horários perdidos) com rotina, projeto,
 * ticket e repositório vinculado. Consulta apenas dados locais já registrados; nada é recalculado nem inventado.
 * Métricas contam execuções de QA reais (PASS/FAIL/BLOCKED/NOT_RUN). Consultas (INFO) e horários perdidos ficam à parte,
 * e abrir a interface nunca conta como execução.
 */
export const filtroExecucoes = z.object({
  espacoId: z.string().uuid().optional(), rotinaId: z.string().uuid().optional(), ticket: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(),
  repositorio: z.string().max(200).optional(), estado: z.enum(['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO']).optional(),
  resultado: z.enum(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO']).optional(),
  since: z.string().datetime().optional(), until: z.string().datetime().optional(), limite: z.number().int().min(1).max(500).default(100)
}).strict();

export type FiltroExecucoes = z.input<typeof filtroExecucoes>;
