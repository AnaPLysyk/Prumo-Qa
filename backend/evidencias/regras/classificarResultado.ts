/** Decide o estado final de uma execução: BLOCKED (impedida), NOT_RUN (não rodou), FAIL ou PASS. Falha de processo nunca vira PASS. */
import { z } from 'zod';
import { Status, casoResultadoSchema } from '../tipos/evidencia.js';

export function classificarResultado(exitCode:number|null, blockedReason?:string, cases:z.infer<typeof casoResultadoSchema>[] = []): Status {
  if (blockedReason) return 'BLOCKED';
  if (exitCode === null) return 'NOT_RUN';
  if (exitCode !== 0 || cases.some(c => c.status === 'FAIL')) return 'FAIL';
  if (cases.some(c => c.status === 'BLOCKED')) return 'BLOCKED';
  if (cases.some(c => c.status === 'NOT_RUN')) return 'NOT_RUN';
  return 'PASS';
}
