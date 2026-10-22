/** Execuções e planos Qase — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { marcadorDaOperacao } from "../../conexoes/escrita/chaveDaOperacao.js";
import { ErroServico } from "../../conexoes/integracoes/configuracaoDosServicos.js";
import { DefOperacao } from "../../conexoes/tipos/operacao.js";
import { enviarArquivoAoQase } from "./enviarArquivoAoQase.js";
import { conferirCasosNoQase, listarNoQase, resultadosDaRun } from "./casosQase.js";
import { conferirIdsDoObjetoQase, idCriadoNoQase } from "./casosQase.js";
import { criarRun, completarRun, publicar, criarPlano } from "../tipos/escritaQase.js";

// ── execucoesQase ──
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

/** Hashes que o resultado leva: os já enviados antes (anexos) e os dos arquivos que este envio subiu, no máximo 10. */
const anexosDe = (r: z.infer<typeof publicar>['resultados'][number], hashes: Map<string, string>) => [...(r.anexos ?? []), ...(r.arquivos ?? []).map(a => hashes.get(a)).filter((h): h is string => !!h)].slice(0, 10);
const evidenciasDe = (p: z.infer<typeof publicar>) => p.resultados.reduce((n, r) => n + (r.arquivos?.length ?? 0), 0);

export const publicarResultadosNoQase: DefOperacao<z.infer<typeof publicar>> = {
  id: 'qase.publicar_resultados', servico: 'qase', rotulo: 'Publicar resultados na run do Qase', efeito: 'Envia o resultado de cada caso (passed, failed, blocked, skipped ou invalid), com o resultado dos passos e os arquivos de evidência do cenário quando houver, à run. Casos que esta mesma publicação já registrou não são reenviados; depois do envio a run é relida para confirmar.', exigeConfirmacao: true, schema: publicar,
  resumo: p => `Publicar ${p.resultados.length} resultado(s) na run ${p.runId}: ${(['passed', 'failed', 'blocked', 'skipped', 'invalid'] as const).map(s => `${p.resultados.filter(r => r.status === s).length} ${s}`).filter(t => !t.startsWith('0')).join(', ')}${evidenciasDe(p) ? `; ${evidenciasDe(p)} arquivo(s) de evidência` : ''}`,
  async executar(ctx, rec, p, k, aux) {
    const m = `[${marcadorDaOperacao(k)}]`; await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}`);
    const existentes = await resultadosDaRun(ctx, rec, p.runId); const feitos = new Set(existentes.filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    const faltam = p.resultados.filter(r => !feitos.has(r.casoId)); let enviados = 0;
    // Evidências: cada arquivo sobe uma vez e o hash vai em todos os cenários que o citam. Arquivo fora das pastas de evidência é ignorado, nunca enviado.
    const hashes = new Map<string, string>(); let ignorados = 0;
    for (const caminho of new Set(faltam.flatMap(r => r.arquivos ?? []))) {
      try { const x = await enviarArquivoAoQase(ctx, rec.chave, caminho, aux); if (x.hash) hashes.set(caminho, x.hash); }
      catch (e) { if (e instanceof ErroServico && e.codigo === 'SERVICE_WRITE_BLOCKED') ignorados++; else throw e; }
    }
    for (let i = 0; i < faltam.length; i += 200) {
      const lote = faltam.slice(i, i + 200).map(r => ({ case_id: r.casoId, status: r.status, ...(r.tempoMs !== undefined ? { time_ms: r.tempoMs } : {}), comment: `${mascarar(r.comentario)}\n${m}`.trim(), ...(r.passos?.length ? { steps: r.passos.map(x => ({ status: x.status, ...(x.comentario ? { comment: mascarar(x.comentario) } : {}) })) } : {}), ...(r.stacktrace ? { stacktrace: mascarar(r.stacktrace) } : {}), ...(anexosDe(r, hashes).length ? { attachments: anexosDe(r, hashes) } : {}) }));
      await ctx.enviar('POST', `/v1/result/${codificarParaUrl(rec.chave)}/${p.runId}/bulk`, JSON.stringify({ results: lote })); enviados += lote.length;
    }
    return { id: String(p.runId), detalhes: { enviados, jaRegistrados: p.resultados.length - faltam.length, arquivosEnviados: hashes.size, arquivosIgnorados: ignorados } };
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

// ── criarPlanoNoQase ──
export const criarPlanoNoQase: DefOperacao<z.infer<typeof criarPlano>> = {
  id: 'qase.criar_plano', servico: 'qase', rotulo: 'Criar plano de teste no Qase', efeito: 'Cria um plano com os casos escolhidos (todos conferidos no projeto vinculado).', exigeConfirmacao: true, schema: criarPlano,
  resumo: p => `Criar plano "${p.titulo}" com ${p.casos.length} caso(s)`,
  async executar(ctx, rec, p, k) {
    await conferirCasosNoQase(ctx, rec, p.casos);
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/plan/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim(), cases: [...new Set(p.casos)] })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listarNoQase(ctx, rec, 'plan', {})).find(e => String(e.description ?? '').includes(`[${marcadorDaOperacao(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; },
  async confirmar(ctx, rec, p, r, k) {
    const resposta = z.object({ result: z.object({
      id: z.union([z.number(), z.string()]).transform(String),
      title: z.string().optional(), description: z.string().nullable().optional(),
      cases: z.unknown().optional()
    }).passthrough() }).passthrough().parse(
      await ctx.ler(`/v1/plan/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}`)
    ).result;
    return resposta.id === r.id && resposta.title === mascarar(p.titulo) &&
      resposta.description === `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim() &&
      conferirIdsDoObjetoQase(resposta.cases, p.casos);
  }
};
