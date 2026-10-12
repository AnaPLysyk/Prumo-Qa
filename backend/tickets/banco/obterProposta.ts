/** Busca uma proposta pelo id; se não existe, avisa PROPOSAL_NOT_FOUND. */
import { lerPropostas } from './lerPropostas.js';

export function obterProposta(id: string, b?: string) { const p = lerPropostas(b).itens.find(x => x.id === id); if (!p) throw new Error('PROPOSAL_NOT_FOUND'); return p; }
