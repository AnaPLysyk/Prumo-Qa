/** Preparação real do renderer: resposta simulada; sem Qase, IPC ou perfil de pessoa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/pagina-do-plano-qase.parte.js', 'utf8');
const inicio = fonte.indexOf('  const prepararRunDoPlano =');
const fim = fonte.indexOf('/** Página do plano:', inicio);
assert.ok(inicio >= 0 && fim > inicio, 'preparação original localizada');

async function preparar(resposta) {
  const avisos = [], runs = [], consultas = [];
  const ctx = vm.createContext({
    api: { servicoConsultar: async (...args) => { consultas.push(args); return resposta; } },
    tr: texto => texto,
    avisar: (...args) => avisos.push(args),
    prepararRun: async (...args) => { runs.push(args); }
  });
  vm.runInContext(fonte.slice(inicio, fim) + '\nglobalThis.preparar = prepararRunDoPlano;', ctx);
  await ctx.preparar({ id: 'projeto-a' }, { id: 42, title: 'Plano crítico' });
  // Materializa estruturas do contexto VM para comparar valores, sem comparar protótipos de realms.
  return JSON.parse(JSON.stringify({ avisos, runs, consultas }));
}

test('iniciar run do plano preserva IDs retornados como números, strings e objetos', async () => {
  const r = await preparar({ ok: true, data: { dados: { cases: [11, '12', { id: 13 }, { case_id: 14 }] } } });
  assert.deepEqual(r.consultas, [['projeto-a', 'qase', 'plano', {}, '42']]);
  assert.equal(r.runs.length, 1);
  assert.deepEqual(r.runs[0], [{ id: 'projeto-a' }, { planoId: 42, casos: [11, 12, 13, 14], titulo: 'Plano crítico' }]);
  assert.equal(r.avisos.length, 0);
});

test('falha ao consultar plano informa falha, preserva causa e não afirma que plano está vazio', async () => {
  const r = await preparar({ ok: false, error: 'SERVICE_TIMEOUT' });
  assert.equal(r.runs.length, 0);
  assert.equal(r.avisos.length, 1);
  assert.doesNotMatch(r.avisos[0][0], /não tem casos/);
  assert.match(r.avisos[0][0], /SERVICE_TIMEOUT|demorou|consultar|carregar/i);
  assert.equal(r.avisos[0][1], true);
});

test('plano consultado vazio não inicia run e explica ausência de casos', async () => {
  const r = await preparar({ ok: true, data: { dados: { cases: [] } } });
  assert.equal(r.runs.length, 0);
  assert.match(r.avisos[0][0], /não tem casos/);
});
