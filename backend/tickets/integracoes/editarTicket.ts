/** Operação "Atualizar campos de ticket do Jira": altera resumo, descrição ou acrescenta rótulos; não remove nada. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { projetoDoTicket } from './projetoDoTicket.js';
import { textoParaAdf } from './textoParaAdf.js';
import { editar } from '../tipos/escritaJira.js';

export const editarTicket: DefOperacao<z.infer<typeof editar>> = {
  id: 'jira.editar', servico: 'jira', rotulo: 'Atualizar campos de ticket do Jira', efeito: 'Altera resumo, descrição ou adiciona rótulos de um ticket do projeto vinculado. Não remove nada.', exigeConfirmacao: true, schema: editar,
  resumo: p => `Atualizar ${p.ticket}: ${[p.resumo !== undefined && 'resumo', p.descricao !== undefined && 'descrição', p.adicionarRotulos?.length && 'rótulos'].filter(Boolean).join(', ')}`,
  async executar(ctx, rec, p) {
    await projetoDoTicket(ctx, rec, p.ticket); const corpo: Record<string, unknown> = {};
    const fields: Record<string, unknown> = {}; if (p.resumo !== undefined) fields.summary = mascarar(p.resumo); if (p.descricao !== undefined) fields.description = textoParaAdf(mascarar(p.descricao)); if (Object.keys(fields).length) corpo.fields = fields;
    if (p.adicionarRotulos?.length) corpo.update = { labels: p.adicionarRotulos.map(add => ({ add })) };
    await ctx.enviar('PUT', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}`, JSON.stringify(corpo)); return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  async confirmar(ctx, rec, p) { const r = z.object({ fields: z.object({ summary: z.string().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=summary`)); return p.resumo === undefined || r.fields.summary === mascarar(p.resumo); }
};
