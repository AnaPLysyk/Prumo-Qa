/** Contagem e paginação reais do renderer, com Qase simulado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/pagina-da-run-qase.parte.js', 'utf8');
function contexto(api = {}) {
  const c = vm.createContext({ api, tr: t => t });
  vm.runInContext(fonte + '\nglobalThis.contar = contagemDaRunQase; globalThis.carregar = resultadosCompletosDaRun;', c);
  return c;
}
test('em andamento continua pendente e não aumenta a conclusão nem duplica o total', () => {
  const c = contexto();
  const casos = [{ status: 'passed' }, { status: 'in_progress' }, { status: 'untested' }];
  for (const stats of [undefined, { total: 3, passed: 1, untested: 2 }]) {
    const r = c.contar({ stats }, casos);
    assert.equal(r.total, 3);
    assert.equal(r.feitos, 1);
    assert.equal(r.concluido, 33);
    assert.equal(r.n.untested, 1);
    assert.equal(r.n.in_progress, 1);
  }
});
test('carrega todas as páginas de resultados antes de identificar não testados', async () => {
  const chamadas = [];
  const c = contexto({ servicoConsultar: async (...args) => {
    chamadas.push(args);
    return { ok: true, data: args[3].offset ? { dados: [{ case_id: 2, status: 'failed' }], proxima: null } : { dados: [{ case_id: 1, status: 'passed' }], proxima: 100 } };
  } });
  const r = await c.carregar({ id: 'projeto' }, 42);
  assert.equal(r.ok, true);
  assert.equal(r.data.dados.length, 2);
  assert.equal(chamadas[1][3].offset, 100);
  assert.equal(chamadas[1][4], '42');
});
test('falha numa página posterior ou paginação repetida não vira lista parcial de testes pendentes', async () => {
  let n = 0;
  const erro = contexto({ servicoConsultar: async () => ++n === 1 ? { ok: true, data: { dados: [], proxima: 100 } } : { ok: false, error: 'SERVICE_TIMEOUT' } });
  assert.equal((await erro.carregar({ id: 'projeto' }, 42)).error, 'SERVICE_TIMEOUT');
  const repetida = contexto({ servicoConsultar: async () => ({ ok: true, data: { dados: [], proxima: 100 } }) });
  assert.equal((await repetida.carregar({ id: 'projeto' }, 42)).ok, false);
});
