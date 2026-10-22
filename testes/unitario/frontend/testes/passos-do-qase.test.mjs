/** A volta Qase → editor não pode perder resultado esperado nem confundir "E-mail enviado" com a palavra E do BDD. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
const ini = fonte.indexOf('  /** Converte os passos do Qase');
const fim = fonte.indexOf('  /** Normaliza qualquer origem');
assert.ok(ini > 0 && fim > ini);
const ctx = {}; vm.createContext(ctx);
const inicioPalavras = fonte.indexOf('  const PALAVRA_INGLES');
const palavras = fonte.slice(inicioPalavras, fonte.indexOf(String.fromCharCode(10), inicioPalavras));
vm.runInContext(palavras + String.fromCharCode(10) + fonte.slice(ini, fim) + String.fromCharCode(10) + 'this.passos = passosDoQase; this.separar = separarPalavra;', ctx);
const passos = (x) => JSON.parse(JSON.stringify(ctx.passos(x)));

test('todos os passos com palavra BDD e sem esperado viram BDD (também em inglês)', () => {
  const r = passos([{ action: 'Dado que o pedido está aberto' }, { action: 'When o cliente cancela' }, { action: 'Então o pedido é cancelado' }]);
  assert.deepEqual(r.map(p => [p.formato, p.palavra, p.acao]), [['bdd', 'Dado', 'que o pedido está aberto'], ['bdd', 'Quando', 'o cliente cancela'], ['bdd', 'Então', 'o pedido é cancelado']]);
});

test('caso misto ou com resultado esperado continua clássico e mantém o esperado', () => {
  const misto = passos([{ action: 'Dado que existe pedido' }, { action: 'Abrir a tela', expected_result: 'Tela aberta', data: 'x=1' }]);
  assert.deepEqual(misto.map(p => p.formato), ['normal', 'normal']);
  assert.equal(misto[1].esperado, 'Tela aberta'); assert.equal(misto[1].dados, 'x=1'); assert.equal(misto[0].acao, 'Dado que existe pedido');
  const comEsperado = passos([{ action: 'Dado que existe', expected_result: 'ok' }]);
  assert.equal(comEsperado[0].formato, 'normal'); assert.equal(comEsperado[0].esperado, 'ok');
});

test('"E-mail enviado" não é tratado como a palavra E', () => {
  assert.equal(passos([{ action: 'E-mail enviado ao cliente' }])[0].formato, 'normal');
  assert.equal(passos([]).length, 0);
});
