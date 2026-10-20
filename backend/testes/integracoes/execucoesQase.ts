/** Cria, encerra e publica resultados de execuções no Qase. */
import { z } from "zod";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { marcadorDaOperacao } from "../../conexoes/escrita/marcadorDaOperacao.js";
import { DefOperacao } from "../../conexoes/tipos/operacao.js";
import { conferirCasosNoQase, listarNoQase, resultadosDaRun } from "./pesquisasQase.js";
import { conferirIdsDoObjetoQase, idCriadoNoQase } from "./formatosQase.js";
import { criarRun, completarRun, publicar } from "../tipos/escritaQase.js";

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

export const encerrarRunNoQase: DefOperacao<z.infer<typeof completarRun>> = {
  id: 'qase.completar_run', servico: 'qase', rotulo: 'Encerrar run no Qase', efeito: 'Marca a run como concluída no Qase. Casos sem resultado continuam sem resultado.', exigeConfirmacao: true, schema: completarRun,
  resumo: p => `Encerrar a run ${p.runId}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}`); await ctx.enviar('POST', `/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}/complete`, '{}'); return { id: String(p.runId) }; }
};

/** Espera base entre releituras (ms); exportada para os testes simularem o atraso sem esperar de verdade. */
let esperaDaConfirmacao = 1200;

export const definirEsperaDaConfirmacao = (ms: number) => { esperaDaConfirmacao = ms; };

export const publicarResultadosNoQase: DefOperacao<z.infer<typeof publicar>> = {
  id: 'qase.publicar_resultados', servico: 'qase', rotulo: 'Publicar resultados na run do Qase', efeito: 'Envia o resultado de cada caso (passed, failed, blocked ou skipped) à run. Casos que esta mesma publicação já registrou não são reenviados; depois do envio a run é relida para confirmar.', exigeConfirmacao: true, schema: publicar,
  resumo: p => `Publicar ${p.resultados.length} resultado(s) na run ${p.runId}: ${(['passed', 'failed', 'blocked', 'skipped'] as const).map(s => `${p.resultados.filter(r => r.status === s).length} ${s}`).filter(t => !t.startsWith('0')).join(', ')}`,
  async executar(ctx, rec, p, k) {
    const m = `[${marcadorDaOperacao(k)}]`; await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}`);
    const existentes = await resultadosDaRun(ctx, rec, p.runId); const feitos = new Set(existentes.filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    const faltam = p.resultados.filter(r => !feitos.has(r.casoId)); let enviados = 0;
    for (let i = 0; i < faltam.length; i += 200) {
      const lote = faltam.slice(i, i + 200).map(r => ({ case_id: r.casoId, status: r.status, ...(r.tempoMs !== undefined ? { time_ms: r.tempoMs } : {}), comment: `${mascarar(r.comentario)}\n${m}`.trim(), ...(r.stacktrace ? { stacktrace: mascarar(r.stacktrace) } : {}), ...(r.anexos ? { attachments: r.anexos } : {}) }));
      await ctx.enviar('POST', `/v1/result/${codificarParaUrl(rec.chave)}/${p.runId}/bulk`, JSON.stringify({ results: lote })); enviados += lote.length;
    }
    return { id: String(p.runId), detalhes: { enviados, jaRegistrados: p.resultados.length - faltam.length } };
  },
  async reconciliar(ctx, rec, p, k) {
    const m = `[${marcadorDaOperacao(k)}]`; const feitos = new Set((await resultadosDaRun(ctx, rec, p.runId)).filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    return p.resultados.every(r => feitos.has(r.casoId)) ? { id: String(p.runId), detalhes: { enviados: 0, jaRegistrados: p.resultados.length } } : null;
  },
  // O envio em lote é processado de forma assíncrona pelo Qase (homologação 15/10/2026): relê até 3 vezes antes de dizer "não confirmado".
  async confirmar(ctx, rec, p, _r, k) {
    const m = `[${marcadorDaOperacao(k)}]`;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      if (tentativa) await new Promise(ok => setTimeout(ok, esperaDaConfirmacao * tentativa));
      const feitos = new Set((await resultadosDaRun(ctx, rec, p.runId)).filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
      if (p.resultados.every(r => feitos.has(r.casoId))) return true;
    }
    return false;
  }
};
