/** Evita o retorno da tela Início antiga, preservando a esfera compartilhada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Início possui uma única tela e mantém a identidade visual compartilhada', () => {
 const manifest=JSON.parse(fs.readFileSync('ferramentas/frontend/telas-modulares.json','utf8'));
 const b=manifest.bundles.find(x=>x.destino==='dist/renderer/interfaces.js');
 assert.ok(b.origens.includes('frontend/inicio/tela-inicio.parte.js'));
 const src=fs.readFileSync('frontend/inicio/tela-inicio.parte.js','utf8');
 assert.match(src,/abas\.inicio\s*=\s*async/);
 assert.match(src,/conversa\.montar\(\)/);
 assert.doesNotMatch(src,/Logs: terminal/);
 const all=b.origens.map(p=>{const s=fs.readFileSync(p,'utf8');return s.slice(s.indexOf('\n')+1)}).join('');
 assert.equal(all,fs.readFileSync(b.destino,'utf8'));
 assert.equal((all.match(/abas\.inicio\s*=/g)||[]).length,1);
 assert.ok(!fs.existsSync('frontend/inicio/mostrarInicio.js'));
 const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
 assert.ok(!html.includes('telas/inicio/mostrarInicio.js'));
 assert.ok(html.includes('src="qc.js"'));
});
