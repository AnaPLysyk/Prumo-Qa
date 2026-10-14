/** IDE de Testes: a escrita de arquivos de teste só acontece dentro da pasta do projeto, sem tocar em banco ou projeto externo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { escreverArquivoDeTeste } from '../../../../dist/testes/regras/escreverArquivoDeTeste.js';

const sha = (t) => createHash('sha256').update(t).digest('hex');
const pasta = (t) => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-ide-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };

test('cria arquivo novo em pasta nova, depois edita com o SHA-256 lido e não deixa temporário', (t) => {
  const raiz = pasta(t);
  const novo = escreverArquivoDeTeste(raiz, 'tests/e2e/login.spec.ts', "test('entra', () => {});\n", null);
  assert.equal(novo.criado, true); assert.equal(novo.arquivo, 'tests/e2e/login.spec.ts'); assert.equal(novo.hash, sha("test('entra', () => {});\n"));
  assert.equal(fs.readFileSync(path.join(raiz, 'tests/e2e/login.spec.ts'), 'utf8'), "test('entra', () => {});\n");
  const edit = escreverArquivoDeTeste(raiz, 'tests/e2e/login.spec.ts', "test('entra', () => {});\ntest('sai', () => {});\n", novo.hash);
  assert.equal(edit.criado, false); assert.equal(edit.linhas, 3);
  assert.deepEqual(fs.readdirSync(path.join(raiz, 'tests/e2e')), ['login.spec.ts'], 'nenhum arquivo temporário');
});

test('arquivo CRLF continua CRLF depois de salvo pelo editor (que usa \\n)', (t) => {
  const raiz = pasta(t); const original = 'a\r\nb\r\n'; fs.writeFileSync(path.join(raiz, 'x.test.js'), original);
  escreverArquivoDeTeste(raiz, 'x.test.js', 'a\nb\nc\n', sha(original));
  assert.equal(fs.readFileSync(path.join(raiz, 'x.test.js'), 'utf8'), 'a\r\nb\r\nc\r\n');
});

test('recusa arquivo alterado por fora, arquivo novo sobre existente e arquivo que sumiu', (t) => {
  const raiz = pasta(t); fs.writeFileSync(path.join(raiz, 'a.spec.ts'), 'um');
  assert.throws(() => escreverArquivoDeTeste(raiz, 'a.spec.ts', 'dois', sha('outro')), /TEST_FILE_CHANGED/);
  assert.throws(() => escreverArquivoDeTeste(raiz, 'a.spec.ts', 'dois', null), /TEST_FILE_EXISTS/);
  assert.throws(() => escreverArquivoDeTeste(raiz, 'nao.spec.ts', 'dois', sha('um')), /TEST_FILE_CHANGED/);
  assert.equal(fs.readFileSync(path.join(raiz, 'a.spec.ts'), 'utf8'), 'um', 'nada foi gravado');
});

test('recusa caminho fora da pasta, absoluto, pasta ignorada e arquivo que não é de teste', (t) => {
  const raiz = pasta(t);
  for (const ruim of ['../fora.spec.ts', 'tests/../../fora.spec.ts', '/etc/x.spec.ts', 'C:/Windows/x.spec.ts', 'C:\\x.spec.ts', 'node_modules/p/x.spec.ts', '.git/hooks/x.test.js', 'tests/.prumo/x.spec.ts', 'leia.md', 'src/app.ts', 'a.spec.ts\u0000.txt', 'tests//x.spec.ts', ''])
    assert.throws(() => escreverArquivoDeTeste(raiz, ruim, 'x', null), /TEST_FILE_INVALID/, JSON.stringify(ruim));
  assert.deepEqual(fs.readdirSync(raiz), [], 'a pasta continua vazia');
  assert.equal(fs.existsSync(path.join(path.dirname(raiz), 'fora.spec.ts')), false);
});

test('recusa conteúdo grande demais e binário', (t) => {
  const raiz = pasta(t);
  assert.throws(() => escreverArquivoDeTeste(raiz, 'g.spec.ts', 'x'.repeat(300_001), null), /TEST_FILE_INVALID/);
  assert.throws(() => escreverArquivoDeTeste(raiz, 'b.spec.ts', 'a\u0000b', null), /TEST_FILE_INVALID/);
  assert.deepEqual(fs.readdirSync(raiz), []);
});

test('não segue atalho de pasta nem de arquivo para fora do projeto', (t) => {
  const raiz = pasta(t), fora = pasta(t);
  try { fs.symlinkSync(fora, path.join(raiz, 'ligacao'), 'junction'); } catch { t.skip('o Windows não permitiu criar o atalho neste ambiente'); return; }
  assert.throws(() => escreverArquivoDeTeste(raiz, 'ligacao/x.spec.ts', 'x', null), /TEST_FILE_INVALID/);
  assert.deepEqual(fs.readdirSync(fora), [], 'nada foi escrito fora do projeto');
});

test('pipelines do GitHub Actions: lista nome, eventos e jobs; grava só em .github/workflows e recusa o resto', async (t) => {
  const { listarPipelines } = await import('../../../../dist/testes/regras/listarPipelines.js');
  const raiz = pasta(t);
  assert.deepEqual(listarPipelines(raiz), [], 'sem pasta de workflows não há pipelines');
  const novo = escreverArquivoDeTeste(raiz, '.github/workflows/ci.yml', "name: CI do projeto\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  testes:\n    runs-on: ubuntu-latest\n  lint:\n    runs-on: ubuntu-latest\n", null);
  assert.equal(novo.criado, true);
  escreverArquivoDeTeste(raiz, '.github/workflows/nightly.yaml', 'on: [schedule, workflow_dispatch]\njobs:\n  e2e:\n    runs-on: x\n', null);
  const lista = listarPipelines(raiz);
  assert.deepEqual(lista.map((p) => p.arquivo), ['.github/workflows/ci.yml', '.github/workflows/nightly.yaml']);
  assert.equal(lista[0].nome, 'CI do projeto'); assert.deepEqual(lista[0].eventos, ['push', 'pull_request']); assert.deepEqual(lista[0].jobs, ['testes', 'lint']);
  assert.equal(lista[1].nome, 'nightly'); assert.deepEqual(lista[1].eventos, ['schedule', 'workflow_dispatch']); assert.deepEqual(lista[1].jobs, ['e2e']);
  for (const ruim of ['.github/workflows/sub/x.yml', '.github/workflows/x.txt', '.github/outro.yml', '.github/workflows/../x.yml', 'workflows/x.yml', '.github/workflows/.yml'])
    assert.throws(() => escreverArquivoDeTeste(raiz, ruim, 'x', null), /TEST_FILE_INVALID/, ruim);
  assert.deepEqual(fs.readdirSync(path.join(raiz, '.github/workflows')).sort(), ['ci.yml', 'nightly.yaml']);
});
