/** Comprova que as funções separadas por tela geram o mesmo código executado pelo Electron. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const raiz = process.cwd();
const manifest = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
test('bundles da interface são reproduzidos exatamente pelas partes de cada tela', () => {
  assert.equal(manifest.schemaVersion, 1);
  for (const bundle of manifest.bundles) {
    assert.ok(bundle.origens.length > 0, 'bundle sem fontes: '+bundle.destino);
    const texto = bundle.origens.map(origem => {
      const fonte = fs.readFileSync(path.join(raiz, origem),'utf8');
      assert.match(fonte, /^\/\*\* [^\n]+\. \*\/\n/, 'descrição na primeira linha: '+origem);
      return fonte.slice(fonte.indexOf('\n')+1);
    }).join('');
    const esperado = fs.readFileSync(path.join(raiz,bundle.destino),'utf8');
    assert.equal(texto, esperado, 'geração deve preservar integralmente '+bundle.destino);
    if (bundle.destino.endsWith('.js')) {
      const sintaxe = spawnSync(process.execPath,['--check', path.join(raiz,bundle.destino)],{encoding:'utf8'});
      assert.equal(sintaxe.status,0,'sintaxe JavaScript de '+bundle.destino+': '+sintaxe.stderr);
    }
  }
});
test('a janela carrega somente os bundles e nunca seus fragmentos internos',()=>{
  const html=fs.readFileSync('dist/renderer/index.html','utf8');
  for (const bundle of manifest.bundles) {
    const relative = bundle.destino.replace('dist/renderer/','');
    if (bundle.destino.endsWith('.css')) {
      assert.ok(html.includes('<link rel="stylesheet" href="'+relative+'">'), 'CSS deve estar no index: '+relative);
    } else {
      assert.ok(html.includes('<script src="'+relative+'"></script>'), 'bundle deve estar no index: '+relative);
    }
    for (const parte of bundle.origens) assert.ok(!html.includes('src="'+parte.replace('dist/renderer/','')+'"'), 'fragmento não pode ser carregado: '+parte);
  }
  assert.ok(html.indexOf('src="fluxos.js"') < html.indexOf('src="tela-testes.js"'), 'testes avançados dependem de Fluxos');
});
