/** Operação "Publicar resultados na run do Qase", sem reenviar o que já foi registrado. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { resultadosDaRun } from './resultadosDaRun.js';
import { publicar } from '../tipos/escritaQase.js';

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
  async confirmar(ctx, rec, p, _r, k) {
    const m = `[${marcadorDaOperacao(k)}]`; const feitos = new Set((await resultadosDaRun(ctx, rec, p.runId)).filter(e => String(e.comment ?? '').includes(m)).map(e => Number(e.case_id)));
    return p.resultados.every(r => feitos.has(r.casoId));
  }
};
