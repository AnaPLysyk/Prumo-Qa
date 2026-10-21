/** Logs: filtros e detalhes pertencem à única fonte visual da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Logs mantém montagem, detalhes e filtros sem módulos minúsculos', () => {
  const b=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8')).bundles.find(x=>x.destino==='dist/renderer/interfaces.js');
  const fonte='frontend/logs/tela-logs.parte.js';
  assert.ok(b.origens.includes(fonte));
  const codigo=fs.readFileSync(fonte,'utf8');
  for(const marcador of [/abas\.logs\s*=\s*async/,/function detalhe\(e\)/,/function carregar\(\)/]) assert.match(codigo,marcador);
  assert.equal((codigo.match(/abas\.logs\s*=/g)||[]).length,1);
  assert.match(codigo,/^\/\*\* /);
  const compilado=b.origens.map(p=>{const s=fs.readFileSync(p,'utf8');return s.slice(s.indexOf('\n')+1)}).join('');
  assert.equal(compilado,fs.readFileSync(b.destino,'utf8'));
});
