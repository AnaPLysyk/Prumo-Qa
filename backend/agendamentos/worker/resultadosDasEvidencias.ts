/** Reúne resultados das evidencias da funcionalidade, mantendo cada operação identificável pelo nome. */
import { Evidencia } from "../../testes/tipos/evidencia.js";
import { ResultadoTrabalho } from "../tipos/fila.js";

export const contarCasosDaEvidencia = (e: Pick<Evidencia, 'cases'>) => ({ pass: e.cases.filter(c => c.status === 'PASS').length, fail: e.cases.filter(c => c.status === 'FAIL').length, blocked: e.cases.filter(c => c.status === 'BLOCKED').length, notRun: e.cases.filter(c => c.status === 'NOT_RUN').length });

export function resultadoDaEvidencia(e: Evidencia & { evidencePath?: string }): ResultadoTrabalho {
  const c = contarCasosDaEvidencia(e); const f = resumoDasFalhas(e.cases);
  return { status: e.status, motivo: e.reason.slice(0, 600), contagem: c, evidenciaId: e.jobId, ...(f ? { detalhes: f } : {}) };
}

export const resumoDasFalhas = (cases: Evidencia['cases']) => cases.filter(c => c.status === 'FAIL').slice(0, 5).map(c => `${c.id}: ${c.evidence}`.slice(0, 300)).join('\n');
