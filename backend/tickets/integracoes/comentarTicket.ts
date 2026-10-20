/** Operação "Comentar em ticket do Jira": só texto; não muda status, campos nem anexos. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { acharComentarioDoPrumo } from './comentariosJira.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { marcadorNoComentario } from './comentariosJira.js';
import { projetoDoTicket } from './projetoDoTicket.js';
import { textoParaAdf } from './textoParaAdf.js';
import { comentar } from '../tipos/escritaJira.js';

export const comentarTicket: DefOperacao<z.infer<typeof comentar>> = {
  id: 'jira.comentar', servico: 'jira', rotulo: 'Comentar em ticket do Jira', efeito: 'Adiciona um comentário de texto ao ticket do projeto vinculado. Não altera status, campos nem anexos.', exigeConfirmacao: true, schema: comentar,
  resumo: p => `Comentar em ${p.ticket}: "${p.texto.slice(0, 80)}${p.texto.length > 80 ? '…' : ''}"`,
  async executar(ctx, rec, p, k) {
    await projetoDoTicket(ctx, rec, p.ticket); const r = z.object({ id: z.string() }).passthrough().parse(await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/comment`, JSON.stringify({ body: textoParaAdf(`${mascarar(p.texto)}\n\n${marcadorNoComentario(k)}`) })));
    return { id: r.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  reconciliar: (ctx, _rec, p, k) => acharComentarioDoPrumo(ctx, p.ticket, k),
  async confirmar(ctx, _rec, p, _r, k) { return (await acharComentarioDoPrumo(ctx, p.ticket, k)) !== null; }
};
