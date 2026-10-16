/** Operação "Editar caso de teste no Qase". */
import { z } from 'zod';
import { automacaoLida, flagsDeAutomacao } from './automacaoNoQase.js';
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
    if (p.automacao) Object.assign(c, flagsDeAutomacao(p.automacao));
    await ctx.enviar('PATCH', `/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`, JSON.stringify(c)); return { id: String(p.casoId), chave: `${rec.chave}-${p.casoId}` };
  },
  async confirmar(ctx, rec, p) {
    const c = z.object({ result: z.object({
      title: z.string().optional(), description: z.string().nullable().optional(),
      preconditions: z.string().nullable().optional(), priority: z.number().nullable().optional(),
      steps: z.array(z.object({ action: z.string(), expected_result: z.string().nullable().optional(), data: z.string().nullable().optional() }).passthrough()).optional(),
      isManual: z.union([z.boolean(), z.number()]).optional(), isToBeAutomated: z.union([z.boolean(), z.number()]).optional(), automation: z.number().nullable().optional()
    }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`)).result;
    if (p.titulo !== undefined && c.title !== mascarar(p.titulo)) return false;
    if (p.descricao !== undefined && c.description !== mascarar(p.descricao)) return false;
    if (p.preCondicoes !== undefined && c.preconditions !== mascarar(p.preCondicoes)) return false;
    if (p.prioridade !== undefined && c.priority !== p.prioridade) return false;
    if (p.passos !== undefined && (c.steps?.length !== p.passos.length || p.passos.some((s, i) => c.steps?.[i]?.action !== mascarar(s.acao) || (c.steps?.[i]?.expected_result ?? '') !== mascarar(s.esperado) || (c.steps?.[i]?.data ?? '') !== mascarar(s.dados)))) return false;
    if (p.automacao !== undefined && automacaoLida(c) !== p.automacao) return false;
    return true;
  }
};
