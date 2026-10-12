/** Operação "Editar caso de teste no Qase". */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { editarCaso } from '../tipos/escritaQase.js';

export const editarCasoNoQase: DefOperacao<z.infer<typeof editarCaso>> = {
  id: 'qase.editar_caso', servico: 'qase', rotulo: 'Editar caso de teste no Qase', efeito: 'Altera título, descrição, pré-condições, passos, prioridade ou automação de um caso existente do projeto vinculado.', exigeConfirmacao: true, schema: editarCaso,
  resumo: p => `Editar caso ${p.casoId}: ${Object.keys(p).filter(k => k !== 'casoId').join(', ')}`,
  async executar(ctx, rec, p) {
    await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`); // 404 se o caso não pertence ao projeto vinculado
    const c: Record<string, unknown> = {}; if (p.titulo !== undefined) c.title = mascarar(p.titulo); if (p.descricao !== undefined) c.description = mascarar(p.descricao); if (p.preCondicoes !== undefined) c.preconditions = mascarar(p.preCondicoes);
    if (p.passos) { c.steps = p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })); c.steps_type = 'classic'; } if (p.prioridade !== undefined) c.priority = p.prioridade;
    if (p.automacao) { c.isManual = p.automacao !== 'automatizado'; c.isToBeAutomated = p.automacao === 'a-automatizar'; }
    await ctx.enviar('PATCH', `/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`, JSON.stringify(c)); return { id: String(p.casoId), chave: `${rec.chave}-${p.casoId}` };
  },
  async confirmar(ctx, rec, p) { if (p.titulo === undefined) return true; const c = z.object({ result: z.object({ title: z.string() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`)); return c.result.title === mascarar(p.titulo); }
};
