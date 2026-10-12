/** Edita uma proposta aberta; a revisão anterior deixa de valer. */
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { alterarProposta } from '../banco/alterarProposta.js';
import { validarDadosDaProposta } from './validarDadosDaProposta.js';

/** Edição pela pessoa: invalida a revisão anterior (o conteúdo mudou). */
export function editarProposta(id: string, dados: unknown, extras: { requisito?: string; risco?: string }, b?: string) {
  return alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); const d = validarDadosDaProposta(p.tipo, dados) as Record<string, unknown>; p.dados = d; p.titulo = mascarar(String(p.tipo === 'caso' ? d.titulo : d.resumo)).slice(0, 255); if (extras.requisito !== undefined) p.requisito = mascarar(extras.requisito).slice(0, 500); if (extras.risco !== undefined) p.risco = mascarar(extras.risco).slice(0, 300); p.revisao = null; p.estado = 'RASCUNHO'; }, b);
}
