import test from 'node:test';
import assert from 'node:assert/strict';
import { publicar } from '../../../../dist/testes/tipos/escritaQase.js';
import { publicarResultadosNoQase } from '../../../../dist/testes/integracoes/execucoesQase.js';
import { planoDaConsultaQase } from '../../../../dist/conexoes/integracoes/qase.js';

test('publicar aceita passed, failed, blocked, skipped e invalid, e resultado por passo', () => {
  for (const status of ['passed', 'failed', 'blocked', 'skipped', 'invalid']) assert.ok(publicar.safeParse({ runId: 2, resultados: [{ casoId: 1, status }] }).success, status);
  const r = publicar.safeParse({ runId: 2, resultados: [{ casoId: 1, status: 'failed', comentario: 'botão sumiu', passos: [{ status: 'passed' }, { status: 'failed', comentario: 'sem botão' }] }] });
  assert.ok(r.success);
  assert.equal(r.data.resultados[0].passos[0].comentario, '');
});

test('publicar recusa status inventado e passo com status que o Qase não aceita por passo', () => {
  assert.equal(publicar.safeParse({ runId: 2, resultados: [{ casoId: 1, status: 'ok' }] }).success, false);
  assert.equal(publicar.safeParse({ runId: 2, resultados: [{ casoId: 1, status: 'passed', passos: [{ status: 'invalid' }] }] }).success, false);
});

test('o envio leva os passos no lote e o resumo conta invalid', async () => {
  const enviados = [];
  const ctx = { ler: async (caminho) => (caminho.includes('/v1/result/') ? { status: true, result: { entities: [] } } : { status: true, result: {} }), enviar: async (metodo, caminho, corpo) => { enviados.push({ metodo, caminho, corpo: JSON.parse(corpo) }); return {}; } };
  const p = publicar.parse({ runId: 7, resultados: [{ casoId: 1, status: 'invalid', comentario: 'ambiente fora', passos: [{ status: 'blocked', comentario: 'sem acesso' }] }] });
  assert.match(publicarResultadosNoQase.resumo(p), /1 invalid/);
  await publicarResultadosNoQase.executar(ctx, { chave: 'PQ' }, p, 'k1');
  const envio = enviados.find((x) => x.caminho.endsWith('/bulk'));
  assert.ok(envio, 'o lote foi enviado');
  assert.equal(envio.corpo.results[0].status, 'invalid');
  assert.deepEqual(envio.corpo.results[0].steps, [{ status: 'blocked', comment: 'sem acesso' }]);
});

test('o detalhe da run pede os casos, para listar também os que ainda não têm resultado', () => {
  const plano = planoDaConsultaQase({ chave: 'PQ', id: 'PQ' }, 'run', { offset: 0, limite: 100 }, '2');
  assert.match(plano.endpoint, /\/v1\/run\/PQ\/2\?.*include=cases/);
});
