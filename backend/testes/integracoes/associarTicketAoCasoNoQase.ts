/** Operação "Associar caso do Qase a ticket do Jira". */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { associarCasoAoTicket } from './associarCasoAoTicket.js';
import { associarTicket } from '../tipos/escritaQase.js';

export const associarTicketAoCasoNoQase: DefOperacao<z.infer<typeof associarTicket>> = {
  id: 'qase.associar_ticket', servico: 'qase', rotulo: 'Associar caso do Qase a ticket do Jira', efeito: 'Registra no Qase o ticket Jira (jira-cloud) de origem do caso.', exigeConfirmacao: true, schema: associarTicket,
  resumo: p => `Associar caso ${p.casoId} ao ticket ${p.ticket}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`); await associarCasoAoTicket(ctx, rec, String(p.casoId), p.ticket); return { id: String(p.casoId), chave: p.ticket }; },
  async reconciliar(ctx, rec, p) {
    const c = z.object({ result: z.object({ external_issues: z.array(z.object({ type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).default([]) }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}?include=external_issues`));
    return c.result.external_issues.some(g => g.type === 'jira-cloud' && g.issues.some(i => i.id === p.ticket)) ? { id: String(p.casoId), chave: p.ticket } : null;
  },
  async confirmar(ctx, rec, p) {
    const c = z.object({ result: z.object({
      external_issues: z.array(z.object({
        type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).default([])
      }).passthrough()).default([])
    }).passthrough() }).passthrough().parse(
      await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}?include=external_issues`)
    );
    return c.result.external_issues.some(g => g.type === 'jira-cloud' && g.issues.some(i => i.id === p.ticket));
  }
};
