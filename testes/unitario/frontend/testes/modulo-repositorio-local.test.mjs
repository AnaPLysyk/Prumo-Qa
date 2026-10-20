/** Garante que Testes mantém repositório local e Qase em fragmentos distintos do mesmo bundle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Testes deixa Qase e repositório local em arquivos distintos com uma única entrada por fragmento', () => {
  const qase = 'frontend/testes/fluxos-casos-qase.parte.js';
  const local = 'frontend/testes/fluxos-repositorio-local.parte.js';
  const origemQase = fs.readFileSync(qase, 'utf8');
  const origemLocal = fs.readFileSync(local, 'utf8');
  const manifesto = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json', 'utf8'));
  const bundle = manifesto.bundles.find(b => b.destino === 'dist/renderer/fluxos.js');
  assert.ok(bundle, 'o bundle de Testes precisa estar declarado');
  const posQase = bundle.origens.indexOf(qase);
  const posLocal = bundle.origens.indexOf(local);
  assert.ok(posQase >= 0 && posLocal === posQase + 1, 'fragmentos devem carregar na ordem necessária');
  assert.equal(bundle.origens.filter(x => x === local).length, 1, 'o mesmo código não pode ser gerado duas vezes');
  assert.match(origemLocal, /^\/\*\* Testes:/);
  assert.match(origemLocal, /function formularioSuiteLocal/);
  assert.match(origemLocal, /async function telaCasosLocais/);
  assert.match(origemLocal, /if \(vinc\(e, 'qase'\)\) return/);
  assert.doesNotMatch(origemQase, /function formularioSuiteLocal|async function telaCasosLocais/);
  assert.match(origemQase, /async function novoCasoQase/);
});
