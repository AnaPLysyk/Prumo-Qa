/** Escreve as cinco primeiras falhas de uma evidência em texto curto. */
import { Evidencia } from '../../testes/tipos/evidencia.js';

export const resumoDasFalhas = (cases: Evidencia['cases']) => cases.filter(c => c.status === 'FAIL').slice(0, 5).map(c => `${c.id}: ${c.evidence}`.slice(0, 300)).join('\n');
