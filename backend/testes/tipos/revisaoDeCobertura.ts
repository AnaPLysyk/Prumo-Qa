/** Formato do plano enviado para revisão de cobertura (requisito, cenários, testes existentes, contradições). */
import { z } from 'zod';

export const texto = z.string().max(4000);

export const cenarioSchema = z.object({
  id: z.string().min(1).max(80), behavior: texto, source: texto.optional(), risk: texto.optional(),
  expected: texto.optional(), oracle: texto.optional(), technique: z.enum(['equivalence','boundary','decision_table','state_transition','white_box','experience']).optional(),
  partition: texto.optional(), conditions: texto.optional(), boundary: z.number().optional(),
  testPath: texto.optional(), blockedReason: texto.optional()
}).strict();

export const revisaoSchema = z.object({
  requirement: texto, source: texto, sourcePath: texto.optional(),
  existingTests: z.array(cenarioSchema).max(100), candidates: z.array(cenarioSchema).max(100),
  contradictions: z.array(z.object({ source: texto, statement: texto }).strict()).max(20).default([]),
  contextoId: z.string().uuid().optional()
}).strict();

export type Revisao = z.infer<typeof revisaoSchema>;
