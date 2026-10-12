/** Operação "Criar ticket no Jira": prévia, envio e conferência; liga ao ticket de origem se informado. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao, Remoto } from '../../conexoes/tipos/operacao.js';
import { acharTicketCriadoPeloPrumo } from './acharTicketCriadoPeloPrumo.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { projetoDoTicket } from './projetoDoTicket.js';
import { textoParaAdf } from './textoParaAdf.js';
import { tiposDeCriacao } from './tiposDeCriacao.js';
import { criar } from '../tipos/escritaJira.js';

export const criarTicket: DefOperacao<z.infer<typeof criar>> = {
  id: 'jira.criar_ticket', servico: 'jira', rotulo: 'Criar ticket no Jira', efeito: 'Cria um ticket (bug, melhoria ou tarefa) no projeto Jira vinculado e, se informado, o relaciona ao ticket de origem.', exigeConfirmacao: true, schema: criar,
  resumo: p => `Criar ticket "${p.resumo}" (tipo ${p.tipoId})${p.origem ? ` relacionado a ${p.origem}` : ''}`,
  async executar(ctx, rec, p, k) {
    const tipos = await tiposDeCriacao(ctx, rec); const t = tipos.find(x => x.id === p.tipoId);
    if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED'); if (t.subtarefa) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    if (p.origem) await projetoDoTicket(ctx, rec, p.origem);
    const fields = { project: { id: rec.id }, issuetype: { id: p.tipoId }, summary: mascarar(p.resumo), description: textoParaAdf(mascarar(p.descricao)), labels: [...new Set([...p.rotulos, marcadorDaOperacao(k)])] };
    const nova = z.object({ id: z.string(), key: z.string() }).passthrough().parse(await ctx.enviar('POST', '/rest/api/3/issue', JSON.stringify({ fields })));
    const r: Remoto = { id: nova.id, chave: nova.key, url: enderecoDoTicket(ctx, nova.key), detalhes: { tipo: t.nome } };
    if (p.origem) { try { await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: nova.key }, outwardIssue: { key: p.origem } })); r.detalhes!.vinculo = p.origem; } catch (e) { r.detalhes!.vinculo = 'FALHOU:' + ((e as ErroServico).codigo ?? 'ERRO'); } }
    return r;
  },
  reconciliar: (ctx, rec, _p, k) => acharTicketCriadoPeloPrumo(ctx, rec, marcadorDaOperacao(k)),
  async confirmar(ctx, rec, _p, r) { await projetoDoTicket(ctx, rec, r.chave!); return true; }
};
