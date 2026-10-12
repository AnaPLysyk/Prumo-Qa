/** Registra a revisão da pessoa (duplicidade, requisito, risco e cobertura) e quem revisou. */
import { alterarProposta } from '../banco/alterarProposta.js';

export function revisarProposta(id: string, r: { duplicidade: boolean; requisito: boolean; risco: boolean; cobertura: boolean }, por: string, b?: string, agora = new Date()) {
  return alterarProposta(id, p => {
    if (p.estado === 'PUBLICADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED');
    if (![r.duplicidade, r.requisito, r.risco, r.cobertura].every(Boolean)) throw new Error('REVIEW_INCOMPLETE: confirme duplicidade, requisito, risco e cobertura.');
    if (p.origem === 'IA' && p.tipo === 'caso' && !p.requisito.trim()) throw new Error('REVIEW_REQUIREMENT_MISSING: informe o requisito que o caso cobre.');
    p.revisao = { ...r, por, em: agora.toISOString() }; p.estado = 'REVISADA';
  }, b);
}
