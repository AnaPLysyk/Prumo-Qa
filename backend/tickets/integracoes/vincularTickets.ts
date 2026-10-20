/** Operação "Vincular tickets do Jira" (ex.: defeito ↔ história). */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { enderecoDoTicket } from './formatoDoTicket.js';
import { projetoDoTicket } from './formatoDoTicket.js';
import { vincular } from '../tipos/escritaJira.js';

export const vincularTickets: DefOperacao<z.infer<typeof vincular>> = {
  id: 'jira.vincular', servico: 'jira', rotulo: 'Vincular tickets do Jira', efeito: 'Cria um vínculo entre dois tickets do projeto vinculado (por exemplo, defeito e história).', exigeConfirmacao: true, schema: vincular,
  resumo: p => `Vincular ${p.ticket} a ${p.comTicket} (${p.tipoVinculo})`,
  async executar(ctx, rec, p) {
    await projetoDoTicket(ctx, rec, p.ticket); await projetoDoTicket(ctx, rec, p.comTicket);
    await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: p.ticket }, outwardIssue: { key: p.comTicket } })); return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  async reconciliar(ctx, _rec, p) {
    const r = z.object({ fields: z.object({ issuelinks: z.array(z.object({ inwardIssue: z.object({ key: z.string() }).passthrough().optional(), outwardIssue: z.object({ key: z.string() }).passthrough().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=issuelinks`));
    return r.fields.issuelinks.some(l => l.inwardIssue?.key === p.comTicket || l.outwardIssue?.key === p.comTicket) ? { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) } : null;
  }
};
