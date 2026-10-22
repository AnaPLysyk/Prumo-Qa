/** Regras de qualidade do cenário: dizem o que falta sem bloquear o salvamento. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
const ini = fonte.indexOf('  const FONTE_QUALIDADE');
const fim = fonte.indexOf('  const lerRegrasDesligadas');
assert.ok(ini > 0 && fim > ini);
const ctx = {}; vm.createContext(ctx); vm.runInContext(fonte.slice(ini, fim) + '\nthis.q = qualidadeDoCenario;', ctx);
const q = (d, o) => JSON.parse(JSON.stringify(ctx.q(d, o)));
const faltando = (r) => r.filter(x => !x.ok).map(x => x.texto);

test('cenário BDD completo e rastreável passa em todas as regras', () => {
  const r = q({ titulo: 'Cancelar pedido em aberto', descricao: 'Garante o cancelamento do pedido', preCondicoes: 'Cliente logado', severidade: 3, tags: ['pedidos'],
    passos: [{ formato: 'bdd', palavra: 'Dado', acao: 'a' }, { formato: 'bdd', palavra: 'Quando', acao: 'b' }, { formato: 'bdd', palavra: 'Então', acao: 'c' }] }, { jira: 1 });
  assert.deepEqual(faltando(r), []);
});

test('cenário vazio aponta tudo o que falta', () => {
  const r = q({ titulo: 'Login', passos: [] }, {});
  assert.equal(faltando(r).length, 8);
});

test('BDD fora de ordem e passo normal sem resultado esperado são apontados', () => {
  const fora = q({ titulo: 'Um nome comprido', passos: [{ formato: 'bdd', palavra: 'Então', acao: 'a' }, { formato: 'bdd', palavra: 'Dado', acao: 'b' }] }, {});
  assert.ok(faltando(fora).includes('O resultado é verificável'));
  const normal = q({ titulo: 'Um nome comprido', passos: [{ formato: 'normal', acao: 'a', esperado: '' }] }, {});
  assert.ok(faltando(normal).includes('O resultado é verificável'));
  const muitos = q({ titulo: 'Um nome comprido', passos: Array.from({ length: 13 }, () => ({ formato: 'normal', acao: 'a', esperado: 'x' })) }, {});
  assert.ok(faltando(muitos).includes('Entre 1 e 12 passos (um comportamento por cenário)'));
});

test('perfil automatizado exige o teste do código ligado; regras desligadas não contam', () => {
  const base = { titulo: 'Cancelar pedido em aberto', passos: [] };
  assert.ok(faltando(q({ ...base, automacao: 'automatizado' }, { jira: 1 })).includes('Automatizado: teste do código ligado'));
  assert.ok(!faltando(q({ ...base, automacao: 'automatizado' }, { jira: 1, auto: 1 })).includes('Automatizado: teste do código ligado'));
  assert.ok(!q({ ...base, automacao: 'manual' }, {}).some(x => x.id === 'automacao'), 'perfil manual não tem a regra de automação');
  const todas = q({ ...base }, {}).length;
  assert.equal(q({ ...base }, { desligadas: ['tags', 'severidade'] }).length, todas - 2);
  assert.ok(q({ ...base }, {}).every(x => x.porque && x.porque.length > 10), 'toda regra diz de onde vem');
});
