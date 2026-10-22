import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
const inicio = fonte.indexOf('  function suitesEquivalentes(');
const fim = fonte.indexOf('\n  async function visaoGeral(', inicio);
assert.ok(inicio >= 0 && fim > inicio, 'mapeamento hierárquico localizado');
const contexto = vm.createContext({});
vm.runInContext(`${fonte.slice(inicio, fim)}\nglobalThis.mapear = suitesEquivalentes;`, contexto);
const mapear = contexto.mapear;

test('suítes homônimas só se associam quando a hierarquia e o nome correspondem', () => {
  const locais = [
    { key: 'l:alpha', titulo: 'Alpha', pai: null },
    { key: 'l:beta', titulo: 'Beta', pai: null },
    { key: 'l:alpha-reg', titulo: 'Regressão', pai: 'l:alpha' },
    { key: 'l:beta-reg', titulo: 'Regressão', pai: 'l:beta' },
    { key: 'l:missing-parent', titulo: 'Só local', pai: 'l:ausente' }
  ];
  const qase = [
    { key: 'q:alpha', titulo: 'Alpha', pai: null },
    { key: 'q:beta', titulo: 'Beta', pai: null },
    { key: 'q:alpha-reg', titulo: 'Regressão', pai: 'q:alpha' },
    { key: 'q:beta-reg', titulo: 'Regressão', pai: 'q:beta' },
    { key: 'q:missing-parent', titulo: 'Só local', pai: null }
  ];
  const equivalentes = JSON.parse(JSON.stringify(Array.from(mapear(locais, qase))));
  assert.deepEqual(equivalentes, [
    ['l:alpha', 'q:alpha'],
    ['l:beta', 'q:beta'],
    ['l:alpha-reg', 'q:alpha-reg'],
    ['l:beta-reg', 'q:beta-reg']
  ]);
});

test('suítes homônimas ambíguas não se vinculam arbitrariamente', () => {
  const locais = [
    { key: 'l:parent', titulo: 'Releases', pai: null },
    { key: 'l:first', titulo: 'Smoke', pai: 'l:parent' },
    { key: 'l:second', titulo: 'Smoke', pai: 'l:parent' }
  ];
  const qase = [
    { key: 'q:parent', titulo: 'Releases', pai: null },
    { key: 'q:smoke', titulo: 'Smoke', pai: 'q:parent' }
  ];
  assert.deepEqual(JSON.parse(JSON.stringify(Array.from(mapear(locais, qase)))), [['l:parent', 'q:parent']]);
});
