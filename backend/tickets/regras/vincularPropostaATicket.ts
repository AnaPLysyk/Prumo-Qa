/** Vincula uma proposta de bug a um ticket que já existe no Jira, sem criar nada lá: guarda a chave e registra a ligação com o caso da falha. */
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { associarEspaco } from '../../projetos/regras/associarEspaco.js';
import { alterarProposta } from '../banco/armazenamentoDePropostas.js';
import { obterProposta } from '../banco/armazenamentoDePropostas.js';

/**
 * Vínculo local (a pessoa informou a chave): o Prumo não consulta nem escreve no Jira. A relação ticket ↔ caso só é registrada quando a proposta nasceu
 * de uma falha e o projeto tem Jira e Qase vinculados; sem eles o vínculo fica apenas na proposta.
 */
export function vincularPropostaATicket(id: string, chave: string, b?: string) {
  const ticket = chave.trim().toUpperCase(); if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(ticket)) throw new Error('TICKET_KEY_INVALID: informe a chave do ticket, por exemplo SMART-123.');
  const p = obterProposta(id, b); if (p.tipo !== 'bug') throw new Error('PROPOSAL_NOT_BUG: só propostas de bug se vinculam a um ticket.');
  const e = obterEspaco(p.espacoId, b); const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
  const salva = alterarProposta(id, x => { if (x.estado === 'PUBLICADA' || x.estado === 'VINCULADA' || x.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); x.estado = 'VINCULADA'; x.remoto = { chave: ticket }; }, b);
  if (p.falhaDeOrigem && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira-bug', id: ticket, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Falha da run vinculada a ticket existente pela pessoa' }, b, true); } catch { /* relação já existente */ } }
  return salva;
}
