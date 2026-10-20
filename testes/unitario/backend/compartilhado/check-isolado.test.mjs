/** RegressÃ£o do seletor de check isolado; fixtures em TEMP, sem banco ou projetos externos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argumentos, catalogar, dividirPorIsolamento, planoDeExecucao, raiz } from '../../../../testes/unitario/executar.mjs';

test('filtro --isolado combina com --listar e impede argumentos repetidos', () => {
  const args = argumentos(['--camada', 'frontend', '--isolado', '--listar']);
  assert.equal(args.isolado, true); assert.equal(args.listar, true);
  assert.deepEqual(args.filtros, { camada: 'frontend' });
  assert.throws(() => argumentos(['--isolado', '--isolado']), /TEST_ARGUMENT_INVALID/);
});

test('E2E fica NOT_RUN; entram sÃ³ arquivos sem janela, inclusive migraÃ§Ã£o sintÃ©tica', t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-selecao-isolada-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const nomes = [
    'testes/unitario/backend/compartilhado/seguro.test.mjs',
    'testes/unitario/frontend/projetos/visual.test.mjs',
    'testes/unitario/frontend/aplicativo/migracao-lab.test.mjs'
  ];
  const helper = ['janela', '.mjs'].join('');
  for (const n of nomes) fs.mkdirSync(path.join(base, path.dirname(n)), { recursive: true });
  fs.writeFileSync(path.join(base, nomes[0]), "import test from 'node:test';\ntest('offline', () => {});");
  fs.writeFileSync(path.join(base, nomes[1]), "import { abrir } from '../../infra/" + helper + "';\n");
  fs.writeFileSync(path.join(base, nomes[2]), "import test from 'node:test';\n");
  const grupo = dividirPorIsolamento(catalogar(nomes), base);
  assert.deepEqual(grupo.elegiveis.map(x => x.arquivo), [nomes[0], nomes[2]]);
  assert.deepEqual(grupo.pendentes, [{ arquivo: nomes[1], motivo: 'ELECTRON_NAO_AUTORIZADO' }]);
});

test('plano isolado instala bloqueador antes dos testes e recusa perfil externo de dados', () => {
  const primeiro = catalogar(['testes/unitario/backend/compartilhado/x.test.mjs'])[0];
  const argv = planoDeExecucao([primeiro], {}, true);
  assert.deepEqual(argv.slice(0, 4), [
    '--require', './testes/unitario/infra/bloquear-efeitos.cjs',
    '--require', './testes/unitario/infra/conhecimento-hook.cjs'
  ]);
  assert.throws(() => planoDeExecucao([primeiro], { PRUMO_DATA_DIR: 'C:\\PrumoQA' }, true), /TEST_DATA_PROFILE_BLOCKED/);
});

test('bloqueador impede subprocesso de navegador, SQLite require e TCP remoto sem abrir esses recursos', () => {
  const guard = path.join(raiz, 'testes', 'unitario', 'infra', 'bloquear-efeitos.cjs');
  const amostras = [
    ["require('node:sqlite')", /TEST_ISOLATION_BLOCKED/],
    ["require('node:child_process').spawnSync('electron', [])", /TEST_ISOLATION_BLOCKED/],
    ["new (require('node:net').Socket)().connect({host:'example.com',port:443})", /TEST_EXTERNAL_NETWORK_BLOCKED/]
  ];
  for (const [script, esperado] of amostras) {
    const r = spawnSync(process.execPath, ['--require', guard, '-e', script], {
      cwd: raiz, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' }
    });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, esperado);
  }
});
