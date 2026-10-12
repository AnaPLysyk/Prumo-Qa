/** Operação "Criar test run no Qase" (não executa nada). */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { conferirCasosNoQase } from './conferirCasosNoQase.js';
import { idCriadoNoQase } from './idCriadoNoQase.js';
import { listarNoQase } from './listarNoQase.js';
import { criarRun } from '../tipos/escritaQase.js';

export const criarRunNoQaseOperacao: DefOperacao<z.infer<typeof criarRun>> = {
  id: 'qase.criar_run', servico: 'qase', rotulo: 'Criar test run no Qase', efeito: 'Cria uma run com os casos escolhidos. Criar a run não executa nada nem registra resultado.', exigeConfirmacao: true, schema: criarRun,
  resumo: p => `Criar run "${p.titulo}" com ${p.casos.length} caso(s)`,
  async executar(ctx, rec, p, k) {
    await conferirCasosNoQase(ctx, rec, p.casos);
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/run/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim(), include_all_cases: false, cases: [...new Set(p.casos)], is_autotest: p.autoteste, ...(p.planoId ? { plan_id: p.planoId } : {}) })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listarNoQase(ctx, rec, 'run', { search: p.titulo })).find(e => String(e.description ?? '').includes(`[${marcadorDaOperacao(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; },
  async confirmar(ctx, rec, _p, r) { const x = z.object({ result: z.object({ id: z.number() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}`)); return String(x.result.id) === r.id; }
};
