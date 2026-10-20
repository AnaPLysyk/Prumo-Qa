/** Reúne edicao da proposta da funcionalidade, mantendo cada operação identificável pelo nome. */
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { alterarProposta } from "../banco/armazenamentoDePropostas.js";
import { validarDadosDaProposta } from "./validarDadosDaProposta.js";

/** Edição pela pessoa: invalida a revisão anterior (o conteúdo mudou). */
export function editarProposta(id: string, dados: unknown, extras: { requisito?: string; risco?: string }, b?: string) {
  return alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); const d = validarDadosDaProposta(p.tipo, dados) as Record<string, unknown>; p.dados = d; p.titulo = mascarar(String(p.tipo === 'caso' ? d.titulo : d.resumo)).slice(0, 255); if (extras.requisito !== undefined) p.requisito = mascarar(extras.requisito).slice(0, 500); if (extras.risco !== undefined) p.risco = mascarar(extras.risco).slice(0, 300); p.revisao = null; p.estado = 'RASCUNHO'; }, b);
}

export const descartarProposta = (id: string, b?: string) => alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA') throw new Error('PROPOSAL_CLOSED'); p.estado = 'DESCARTADA'; }, b);

export function revisarProposta(id: string, r: { duplicidade: boolean; requisito: boolean; risco: boolean; cobertura: boolean }, por: string, b?: string, agora = new Date()) {
  return alterarProposta(id, p => {
    if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED');
    if (![r.duplicidade, r.requisito, r.risco, r.cobertura].every(Boolean)) throw new Error('REVIEW_INCOMPLETE: confirme duplicidade, requisito, risco e cobertura.');
    if (p.origem === 'IA' && p.tipo === 'caso' && !p.requisito.trim()) throw new Error('REVIEW_REQUIREMENT_MISSING: informe o requisito que o caso cobre.');
    p.revisao = { ...r, por, em: agora.toISOString() }; p.estado = 'REVISADA';
  }, b);
}
