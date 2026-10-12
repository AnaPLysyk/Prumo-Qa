/** Abre uma proposta, aplica uma alteração, confere e grava. */
import { gravarPropostas } from './gravarPropostas.js';
import { lerPropostas } from './lerPropostas.js';
import { Proposta, propostaSchema } from '../tipos/proposta.js';

export function alterarProposta(id: string, fn: (p: Proposta) => void, b?: string, agora = new Date()) { const r = lerPropostas(b); const p = r.itens.find(x => x.id === id); if (!p) throw new Error('PROPOSAL_NOT_FOUND'); fn(p); p.atualizadaEm = agora.toISOString(); propostaSchema.parse(p); gravarPropostas(r, b); return p; }
