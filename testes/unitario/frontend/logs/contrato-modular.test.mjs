/** Garante que as partes da tela Logs preservam o bundle, sem implementação duplicada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Logs mantém interface, detalhes e atualização em módulos da própria tela', () => {
  const manifest = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
  const b = manifest.bundles.find(x => x.destino === 'dist/renderer/interfaces.js');
  const parts = ['tela-logs.parte.js', 'eventos-e-detalhes.parte.js', 'filtros-e-atualizacao.parte.js'];
  const sources = parts.map(name => 'frontend/logs/' + name);
  const first = b.origens.indexOf(sources[0]);
  assert.deepEqual(b.origens.slice(first, first + parts.length), sources);
  const content = sources.map(p => fs.readFileSync(p,'utf8'));
  assert.match(content[0], /abas\.logs\s*=\s*async/);
  assert.match(content[1], /function detalhe\(e\)/);
  assert.match(content[2], /function carregar\(\)/);
  assert.equal(content.reduce((n,s) => n + (s.match(/abas\.logs\s*=/g) || []).length, 0), 1);
  assert.ok(content.every(s => s.startsWith('/** ')));
  const compiled = b.origens.map(p => {
    const s = fs.readFileSync(p,'utf8');
    return s.slice(s.indexOf('\n') + 1);
  }).join('');
  assert.equal(compiled, fs.readFileSync(b.destino,'utf8'));
});
