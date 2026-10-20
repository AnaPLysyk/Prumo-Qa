/** Formato de uma evidência de execução: estados PASS/FAIL/BLOCKED/NOT_RUN, casos, logs e integridade. */
import { z } from 'zod';

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
