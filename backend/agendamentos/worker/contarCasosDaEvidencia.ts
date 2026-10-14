/** Conta quantos casos de uma evidência passaram, falharam, foram bloqueados ou não rodaram. */
import { Evidencia } from '../../testes/tipos/evidencia.js';

export const contarCasosDaEvidencia = (e: Pick<Evidencia, 'cases'>) => ({ pass: e.cases.filter(c => c.status === 'PASS').length, fail: e.cases.filter(c => c.status === 'FAIL').length, blocked: e.cases.filter(c => c.status === 'BLOCKED').length, notRun: e.cases.filter(c => c.status === 'NOT_RUN').length });
