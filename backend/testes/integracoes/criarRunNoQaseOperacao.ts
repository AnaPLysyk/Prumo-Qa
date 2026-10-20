/** Operação "Criar test run no Qase" (não executa nada). */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { conferirCasosNoQase } from './consultasDeCasosQase.js';
import { conferirIdsDoObjetoQase } from '../integracaoFormatosQase.js';
import { idCriadoNoQase } from '../integracaoFormatosQase.js';
import { listarNoQase } from './listarNoQase.js';
import { criarRun } from '../tipos/escritaQase.js';

export const criarRunNoQaseOperacao: DefOperacao<z.infer<typeof criarRun>> = {
  id: 'qase.criar_run', servico: 'qase', rotulo: 'Criar test run no Qase', efeito: 'Cria uma run com os casos escolhidos. Criar a run não executa nada nem registra resultado.', exigeConfirmacao: true, schema: criarRun,
  resumo: p => `Criar run "${p.titulo}" com ${p.casos.length} caso(s)${p.marcoId ? `, milestone ${p.marcoId}` : ''}${p.ambienteId ? `, ambiente ${p.ambienteId}` : ''}`,
  async executar(ctx, rec, p, k) {
    await conferirCasosNoQase(ctx, rec, p.casos);
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/run/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim(), include_all_cases: false, cases: [...new Set(p.casos)], is_autotest: p.autoteste, ...(p.planoId ? { plan_id: p.planoId } : {}), ...(p.marcoId ? { milestone_id: p.marcoId } : {}), ...(p.ambienteId ? { environment_id: p.ambienteId } : {}) })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listarNoQase(ctx, rec, 'run', { search: p.titulo })).find(e => String(e.description ?? '').includes(`[${marcadorDaOperacao(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; },
  async confirmar(ctx, rec, p, r, k) {
    const resposta = z.object({ result: z.object({
      id: z.union([z.number(), z.string()]).transform(String), title: z.string().optional(),
      description: z.string().nullable().optional(), include_all_cases: z.boolean().optional(),
      is_autotest: z.boolean().optional(), plan_id: z.number().nullable().optional(), milestone_id: z.number().nullable().optional(), milestone: z.object({ id: z.number().optional() }).passthrough().nullable().optional(), environment: z.object({ id: z.number().optional() }).passthrough().nullable().optional(), environment_id: z.number().nullable().optional(),
      cases: z.unknown().optional()
    }).passthrough() }).passthrough().parse(
      await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}?include=cases`)
    ).result;
    return resposta.id === r.id && resposta.title === mascarar(p.titulo) &&
      resposta.description === `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim() &&
      // O GET real da run (homologado em 15/10/2026) não traz include_all_cases nem is_autotest; quando vierem, precisam bater.
      (resposta.include_all_cases === undefined || resposta.include_all_cases === false) && (resposta.is_autotest === undefined || resposta.is_autotest === p.autoteste) &&
      (p.planoId === undefined || resposta.plan_id === p.planoId) &&
      // milestone e ambiente: conferidos quando o Qase os devolve na releitura.
      (p.marcoId === undefined || (resposta.milestone_id ?? resposta.milestone?.id) === undefined || (resposta.milestone_id ?? resposta.milestone?.id) === p.marcoId) &&
      (p.ambienteId === undefined || (resposta.environment_id ?? resposta.environment?.id) === undefined || (resposta.environment_id ?? resposta.environment?.id) === p.ambienteId) &&
      conferirIdsDoObjetoQase(resposta.cases, p.casos);
  }
};
