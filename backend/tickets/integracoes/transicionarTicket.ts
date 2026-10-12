/** Operação "Mudar o status de ticket do Jira" por uma transição disponível. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { projetoDoTicket } from './projetoDoTicket.js';
import { transicoesDoTicket } from './transicoesDoTicket.js';
import { transicionar } from '../tipos/escritaJira.js';

export const transicionarTicket: DefOperacao<z.infer<typeof transicionar>> = {
  id: 'jira.transicionar', servico: 'jira', rotulo: 'Mudar o status de ticket do Jira', efeito: 'Executa uma transição de workflow disponível para o ticket. Aprovação de QA e mudança de status são decisões diferentes; isto só ocorre por ação explícita.', exigeConfirmacao: true, schema: transicionar,
  resumo: p => `Mudar status de ${p.ticket} (transição ${p.transicaoId})`,
  async executar(ctx, rec, p) {
    const lista = await transicoesDoTicket(ctx, rec, p.ticket); const t = lista.find(x => x.id === p.transicaoId); if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/transitions`, JSON.stringify({ transition: { id: p.transicaoId } }));
    return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { transicao: t.nome, para: t.para } };
  },
  async confirmar(ctx, rec, p, r) { const s = await projetoDoTicket(ctx, rec, p.ticket); return r.detalhes?.para == null || s.status === r.detalhes.para; }
};
