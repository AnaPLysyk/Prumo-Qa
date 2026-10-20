/** Assegura a montagem da Documentação Viva a partir de partes por responsabilidade. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Administração carrega um único bundle com árvore, fluxo, código e navegação', () => {
 const manifest=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
 const bundle=manifest.bundles.find(b=>b.destino==='dist/renderer/administracao.js');
 assert.ok(bundle);
 assert.deepEqual(bundle.origens,[
  'frontend/administracao/tela-administracao.parte.js',
  'frontend/administracao/documentacao/explorador.parte.js',
  'frontend/administracao/documentacao/fluxo.parte.js',
  'frontend/administracao/documentacao/codigo-e-telas.parte.js',
  'frontend/administracao/painel-e-navegacao.parte.js'
 ]);
 const contents=bundle.origens.map(p=>fs.readFileSync(p,'utf8'));
 assert.ok(contents.every(s=>s.startsWith('/** ')));
 const codigo=contents.map(s=>s.slice(s.indexOf('\n')+1)).join('');
 assert.equal(codigo,fs.readFileSync(bundle.destino,'utf8'));
 assert.doesNotThrow(()=>new vm.Script(codigo));
 assert.equal((codigo.match(/abas\.administracao\s*=/g)||[]).length,1);
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 assert.ok(html.includes('src="administracao.js"'));
 assert.ok(!html.includes('src="telas/administracao/mostrarAdministracao.js"'));
 assert.ok(!fs.existsSync('frontend/administracao/mostrarAdministracao.js'));
});
