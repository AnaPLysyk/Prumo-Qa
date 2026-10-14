/** Confere se a proposta pode ser publicada: não pode estar fechada e, se veio da IA, precisa ter sido revisada. */
import { Proposta } from '../tipos/proposta.js';

/** Pré-condição de publicação: IA exige revisão completa; as demais origens exigem ao menos a confirmação da pessoa (feita no diálogo nativo). */
export function podePublicar(p: Proposta) { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); if (p.origem === 'IA' && p.estado !== 'REVISADA') throw new Error('REVIEW_REQUIRED: proposta de IA precisa ser revisada antes de publicar.'); return true; }
