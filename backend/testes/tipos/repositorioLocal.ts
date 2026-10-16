/** Cadastro de casos e suítes do modo offline. Independente de propostas e do Qase. */
import { z } from 'zod';
import { esquemaCaso } from './escritaQase.js';

export const dadosCasoLocal = esquemaCaso.omit({ suiteId: true, ticket: true });
export const entradaCasoLocal = z.object({
  espacoId: z.string().uuid(), id: z.string().uuid().optional(),
  dados: dadosCasoLocal, suiteLocalId: z.string().uuid().nullable().optional(),
  requisito: z.string().max(500).optional(), risco: z.string().max(300).optional()
}).strict();
export const entradaSuiteLocal = z.object({
  espacoId: z.string().uuid(), id: z.string().uuid().optional(), titulo: z.string().trim().min(2).max(255),
  descricao: z.string().max(4000).default(''), paiId: z.string().uuid().nullable().optional()
}).strict();
export const casoLocalSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), tipo: z.literal('caso'), origem: z.literal('PESSOA'),
  titulo: z.string().min(3).max(255), dados: dadosCasoLocal, requisito: z.string().max(500),
  risco: z.string().max(300), suiteLocalId: z.string().uuid().nullable(),
  referenciasLegadas: z.object({ ticket: z.string().max(40).optional(), suiteId: z.number().int().positive().optional() }).strict().optional(),
  criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();
export const suiteLocalSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), titulo: z.string().max(255), descricao: z.string().max(4000),
  paiId: z.string().uuid().nullable(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();
export const repositorioLocalSchema = z.object({
  version: z.literal(1), casos: z.array(casoLocalSchema).max(500), suites: z.array(suiteLocalSchema).max(100)
}).strict();
export type CasoLocal = z.infer<typeof casoLocalSchema>;
export type RepositorioLocal = z.infer<typeof repositorioLocalSchema>;
