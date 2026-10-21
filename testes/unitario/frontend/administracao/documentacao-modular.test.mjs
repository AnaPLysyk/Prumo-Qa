/** Garante Documentação Viva e Administração numa fonte coesa com registro único da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Administração mantém árvore, fluxo, código e navegação em um único bundle', () => {
  const m=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
  const b=m.bundles.find(x=>x.destino==='dist/renderer/administracao.js');
  assert.deepEqual(b.origens,['frontend/administracao/tela-administracao.parte.js']);
  const source=fs.readFileSync(b.origens[0],'utf8');
  assert.match(source,/^\/\*\* /);
  const codigo=source.slice(source.indexOf('\n')+1);
  assert.equal(codigo,fs.readFileSync(b.destino,'utf8'));
  assert.doesNotThrow(()=>new vm.Script(codigo));
  assert.equal((codigo.match(/abas\.administracao\s*=/g)||[]).length,1);
  const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
  assert.ok(html.includes('src="administracao.js"'));
  assert.ok(!html.includes('src="telas/administracao/mostrarAdministracao.js"'));
});
