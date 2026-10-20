// Documentação viva (Administração): o mapa gerado do código bate com os canais reais e o leitor recusa arquivo inválido.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gerarMapaDoAplicativo } from '../../../../docs/geradores/gerar-mapa-do-aplicativo.mjs';
import { lerMapaDoAplicativo } from '../../../../dist/administracao/servico.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

test('mapa: cada canal IPC do catálogo aparece uma vez, no controlador da sua tela, e sem código-fonte', () => {
  const mapa = gerarMapaDoAplicativo();
  const canais = mapa.telas.flatMap((t) => t.canais.map((c) => ({ ...c, tela: t.id })));
  assert.deepEqual(canais.map((c) => c.canal).sort(), Object.keys(esquemasIpc).sort());
  for (const c of canais) { assert.ok(c.api.startsWith(`backend/${c.tela}/controlador`), c.canal); assert.ok(fs.existsSync(c.api), c.api); }
  assert.ok(!JSON.stringify(mapa).includes('"codigo"'), 'o mapa não leva o código-fonte');
  const agentes = mapa.telas.find((t) => t.id === 'agentes');
  assert.ok(agentes.frontend.some((a) => a.caminho === 'frontend/agentes/tela-agentes.parte.js'));
  assert.ok(agentes.backend.banco.some((a) => a.caminho === 'backend/agentes/banco/skills.ts'));
  assert.ok(agentes.testes.some((x) => x.caminho.endsWith('banco-de-skills.test.mjs')));
});

test('leitor do mapa: ausente, grande demais, atalho ou fora do formato é recusado; o válido é devolvido', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-mapa-')); t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_MISSING/);
  const dir = path.join(raiz, 'dist', 'documentacao'); fs.mkdirSync(dir, { recursive: true }); const alvo = path.join(dir, 'mapa.json');
  fs.writeFileSync(alvo, '{"schemaVersion":2}'); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, 'não é json'); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, 'x'.repeat(4 * 1024 * 1024 + 1)); assert.throws(() => lerMapaDoAplicativo(raiz), /ARCHITECTURE_MAP_INVALID/);
  fs.writeFileSync(alvo, JSON.stringify(gerarMapaDoAplicativo()));
  const mapa = lerMapaDoAplicativo(raiz); assert.equal(mapa.schemaVersion, 1); assert.ok(mapa.telas.length > 10);
});

test('código da Documentação viva: só arquivos do mapa, caminho com .. recusado no contrato, arquivo grande encurtado', async (t) => {
  const { lerCodigoDoAplicativo } = await import('../../../../dist/administracao/servico.js');
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-codigo-')); t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  fs.mkdirSync(path.join(raiz, 'dist', 'documentacao'), { recursive: true });
  const grande = 'x'.repeat(250 * 1024);
  fs.writeFileSync(path.join(raiz, 'dist', 'documentacao', 'codigo.json'), JSON.stringify({ 'backend/a/api/um.ts': 'linha 1\nlinha 2', 'backend/a/banco/grande.ts': grande }));
  const um = lerCodigoDoAplicativo('backend/a/api/um.ts', raiz);
  assert.equal(um.linhas, 2); assert.equal(um.truncado, false); assert.match(um.texto, /linha 2/);
  const g = lerCodigoDoAplicativo('backend/a/banco/grande.ts', raiz); assert.equal(g.truncado, true); assert.ok(Buffer.byteLength(g.texto) <= 200 * 1024);
  assert.throws(() => lerCodigoDoAplicativo('backend/a/api/outro.ts', raiz), /ARCHITECTURE_CODE_NOT_FOUND/);
  assert.throws(() => lerCodigoDoAplicativo('README.md', raiz), /ARCHITECTURE_CODE_NOT_FOUND/, 'só o que o build gravou, nunca o disco');
  const contrato = esquemasIpc['administracao:codigo'];
  assert.equal(contrato.safeParse({ caminho: 'backend/a/../../segredo.ts' }).success, false);
  assert.equal(contrato.safeParse({ caminho: 'C:/Windows/win.ini' }).success, false);
  assert.equal(contrato.safeParse({ caminho: 'backend/a/api/um.ts' }).success, true);
  fs.rmSync(path.join(raiz, 'dist', 'documentacao', 'codigo.json')); assert.throws(() => lerCodigoDoAplicativo('backend/a/api/um.ts', raiz), /ARCHITECTURE_CODE_MISSING/);
});
