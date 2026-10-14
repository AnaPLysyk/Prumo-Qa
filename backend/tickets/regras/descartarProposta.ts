/** Descarta uma proposta ainda não publicada. */
import { alterarProposta } from '../banco/alterarProposta.js';

export const descartarProposta = (id: string, b?: string) => alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA') throw new Error('PROPOSAL_CLOSED'); p.estado = 'DESCARTADA'; }, b);
