/** Calcula até quando uma autorização vale (de 1 a 30 dias). */
import { MAX_VALIDADE_DIAS } from '../tipos/autorizacoes.js';

export const validadeDaAutorizacao = (dias: number, agora: Date) => { if (!Number.isFinite(dias) || dias <= 0 || dias > MAX_VALIDADE_DIAS) throw new Error('AUTH_VALIDITY_INVALID'); return new Date(agora.getTime() + dias * 86400000).toISOString(); };
