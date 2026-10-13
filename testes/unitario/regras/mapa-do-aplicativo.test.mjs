// Documentação viva (Administração): o mapa gerado do código bate com os canais reais e o leitor recusa arquivo inválido.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gerarMapaDoAplicativo } from '../../../ferramentas/arquitetura/gerar-mapa-do-aplicativo.mjs';
import { lerMapaDoAplicativo } from '../../../dist/administracao/banco/lerMapaDoAplicativo.js';
import { esquemasIpc } from '../../../dist/aplicativo/api/catalogoDeContratos.js';

test('mapa: cada canal IPC do catálogo aparece uma vez, na tela do seu arquivo api/, e sem código-fonte', () => {
  const mapa = gerarMapaDoAplicativo();
  const canais = mapa.telas.flatMap((t) => t.canais.map((c) => ({ ...c, tela: t.id })));
  assert.deepEqual(canais.map((c) => c.canal).sort(), Object.keys(esquemasIpc).sort());
  for (const c of canais) { assert.ok(c.api.startsWith(`backend/${c.tela}/api/`), c.canal); assert.ok(fs.existsSync(c.api), c.api); }
  assert.ok(!JSON.stringify(mapa).includes('"codigo"'), 'o mapa não leva o código-fonte');
  const agentes = mapa.telas.find((t) => t.id === 'agentes');
  assert.ok(agentes.frontend.some((a) => a.caminho === 'frontend/agentes/interfaces-v36-trecho-11.parte.js'));
  assert.ok(agentes.backend.banco.some((a) => a.caminho === 'backend/agentes/banco/listarTrechosDeSkill.ts'));
  assert.ok(agentes.testes.some((x) => x.caminho.endsWith('banco-de-skills.test.mjs')));
});

test('leitor do mapa: ausente, grande demais, atalho ou fora do formato é recusado; o válido é devolvido', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-mapa-')); t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_MISSING/);
  const dir = path.join(raiz, 'app', 'documentacao'); fs.mkdirSync(dir, { recursive: true }); const alvo = path.join(dir, 'mapa.json');
  fs.writeFileSync(alvo, '{"schemaVersion":2}'); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, 'não é json'); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, 'x'.repeat(4 * 1024 * 1024 + 1)); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, JSON.stringify(gerarMapaDoAplicativo()));
  const mapa = lerMapaDoAplicativo(raiz); assert.equal(mapa.schemaVersion, 1); assert.ok(mapa.telas.length > 10);
});
