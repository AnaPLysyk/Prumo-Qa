/** Testes: garante responsabilidade clara e carregamento único dos módulos de Repositório, Editor e IDE. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('a tela Testes tem repositório, editor/pipelines e IDE separados, mantendo um único bundle executável', () => {
  const origem = 'frontend/testes/';
  const partes = [
    'visao-geral-dos-testes.parte.js',
    'editor-e-pipelines.parte.js',
    'ide-codigo.parte.js'
  ].map(arquivo => origem + arquivo);
  const manifesto = JSON.parse(fs.readFileSync('ferramentas/frontend/telas-modulares.json', 'utf8'));
  const bundle = manifesto.bundles.find(item => item.destino === 'dist/renderer/tela-testes.js');
  assert.ok(bundle, 'manifesto deve declarar o bundle de Testes');
  assert.deepEqual(bundle.origens, partes, 'a ordem das funções no bundle não pode mudar');
  const fontes = partes.map(arquivo => fs.readFileSync(arquivo, 'utf8'));
  assert.ok(fontes.every(texto => texto.startsWith('/** ')), 'cada módulo deve descrever sua responsabilidade');
  assert.match(fontes[0], /async function visaoGeral\(/);
  assert.match(fontes[1], /function abrirEditor\(/);
  assert.match(fontes[1], /async function telaPipelines\(/);
  assert.match(fontes[2], /async function telaCodigo\(/);
  assert.match(fontes[2], /function blocoCodigoDoCaso\(/);
  assert.ok(!fontes[0].includes('function abrirEditor('), 'editor não pertence à visão do repositório');
  const concatenado = fontes.map(texto => texto.slice(texto.indexOf('\n') + 1)).join('');
  assert.equal(concatenado, fs.readFileSync(bundle.destino, 'utf8'), 'bundle compilado precisa refletir as fontes');
});
