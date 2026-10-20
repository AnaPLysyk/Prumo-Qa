/** Formato do plano enviado para revisão de cobertura (requisito, cenários, testes existentes, contradições). */
import { z } from 'zod';

const texto = z.string().max(4000);

const cenarioSchema = z.object({
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

/** Um achado da revisão: tipo (ex.: MISSING_ORACLE), severidade, cenário, fonte, recomendação e evidências. */
type AchadoDeCobertura = { type: string; severity: string; scenario?: string; source: string; recommendation: string; evidence: unknown[] };

/** O caderno da revisão, preenchido etapa por etapa: achados, fatos lidos, hipóteses e o que falta. */
export type AnaliseDeCobertura = {
  findings: AchadoDeCobertura[]; facts: unknown[]; hypotheses: unknown[]; missing: string[];
  registrar: (type: string, recommendation: string, scenario?: string, severity?: string) => void;
};
