/** Operação "Anexar arquivo a ticket do Jira": prévia, envio e conferência pelo nome do anexo. */
import path from 'node:path';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { montarEnvioDeArquivo } from '../../conexoes/integracoes/montarEnvioDeArquivo.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { lerAnexo } from './lerAnexo.js';
import { projetoDoTicket } from './projetoDoTicket.js';
import { anexar } from '../tipos/escritaJira.js';

export const anexarArquivo: DefOperacao<z.infer<typeof anexar>> = {
  id: 'jira.anexar', servico: 'jira', rotulo: 'Anexar arquivo a ticket do Jira', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) como anexo do ticket. Textos têm segredos mascarados; imagens e vídeos são enviados como estão.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Anexar "${path.basename(p.arquivo)}" a ${p.ticket}`,
  async executar(ctx, rec, p, _k, aux) {
    await projetoDoTicket(ctx, rec, p.ticket); const a = lerAnexo(p.arquivo, aux); const nome = p.nome ?? a.nome;
    const m = montarEnvioDeArquivo('file', { nome, tipo: a.tipo, dados: a.dados });
    const r = z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).parse(await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/attachments`, m.corpo, m.tipoConteudo, { 'X-Atlassian-Token': 'no-check' }));
    return { id: r[0]?.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { arquivo: r[0]?.filename ?? nome, bytes: r[0]?.size ?? a.tamanho } };
  },
  async reconciliar(ctx, rec, p, _k) {
    const lista = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).default([]) }).passthrough() }).parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=attachment`));
    const nome = p.nome ?? path.basename(p.arquivo); const existe = lista.fields.attachment.find(x => x.filename === nome);
    return existe ? { id: existe.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { arquivo: existe.filename, bytes: existe.size } } : null;
  }
};
