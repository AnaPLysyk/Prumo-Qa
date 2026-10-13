// Garante a organização da pasta testes/: primeiro o TIPO do teste, depois a CAMADA verificada, como diz o catálogo.
// Assim, quando algo quebra, o caminho do arquivo já diz que tipo de verificação falhou e em que parte do sistema.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, 'testes', 'catalogo.json'), 'utf8'));
const tipos = { migracao: 'migracao', e2e: 'e2e', smoke: 'smoke', contrato: 'contrato', seguranca: 'seguranca', acessibilidade: 'acessibilidade', visual: 'visual', unidade: 'unitario' };
const camadas = { ui: 'ui', ipc: 'ipc', mcp: 'mcp', regra: 'regras', persistencia: 'banco', integracao: 'externa' };

test('testes: cada arquivo fica em testes/<tipo>/<camada>/ coerente com o catálogo (ou em testes/estrutura/)', () => {
  const problemas = [];
  for (const t of catalogo.testes) {
    const partes = t.arquivo.split('/');
    if (t.camada === 'estrutura') { if (partes.length !== 3 || partes[1] !== 'estrutura') problemas.push(`${t.arquivo}: teste de estrutura fica em testes/estrutura/`); continue; }
    if (partes.length !== 4) { problemas.push(`${t.arquivo}: use testes/<tipo>/<camada>/arquivo.test.mjs`); continue; }
    const [, tipo, camada] = partes;
    if (camada !== camadas[t.camada]) problemas.push(`${t.arquivo}: camada ${t.camada} fica na pasta ${camadas[t.camada]}/`);
    const aceitos = new Set([...t.natureza.map((n) => tipos[n]).filter(Boolean), t.camada === 'regra' ? 'unitario' : 'integracao']);
    if (!aceitos.has(tipo)) problemas.push(`${t.arquivo}: a pasta ${tipo}/ não corresponde às naturezas ${t.natureza.join(', ')}`);
  }
  assert.deepEqual(problemas, []);
});

test('testes: nada solto na raiz de testes/ além do catálogo e do LEIA-ME; auxiliares ficam em testes/apoio/', () => {
  const soltos = fs.readdirSync(path.join(raiz, 'testes'), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).filter((n) => !['catalogo.json', 'LEIA-ME.md'].includes(n));
  assert.deepEqual(soltos, []);
  const apoio = fs.readdirSync(path.join(raiz, 'testes', 'apoio'));
  assert.ok(apoio.every((n) => !n.endsWith('.test.mjs')), 'testes/apoio/ não tem casos de teste');
});
