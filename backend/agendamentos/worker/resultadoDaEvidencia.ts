/** Transforma a evidência de uma execução no resultado do trabalho: estado, motivo, contagem de casos e as primeiras falhas. */
import { Evidencia } from '../../testes/tipos/evidencia.js';
import { ResultadoTrabalho } from '../tipos/fila.js';
import { contarCasosDaEvidencia } from './contarCasosDaEvidencia.js';
import { resumoDasFalhas } from './resumoDasFalhas.js';

export function resultadoDaEvidencia(e: Evidencia & { evidencePath?: string }): ResultadoTrabalho {
  const c = contarCasosDaEvidencia(e); const f = resumoDasFalhas(e.cases);
  return { status: e.status, motivo: e.reason.slice(0, 600), contagem: c, evidenciaId: e.jobId, ...(f ? { detalhes: f } : {}) };
}
