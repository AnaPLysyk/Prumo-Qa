/** Valida que logs e arquivos de execução não persistam segredos ou relatórios inválidos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { fixture } from '../../infra/fixtures.mjs';
import { mascararLogsDaExecucao } from '../../../../dist/testes/regras/executarValidacao.js';
import { gravarRelatorioRedigido } from '../../../../dist/testes/regras/executarValidacao.js';
import { hash } from '../../../../dist/compartilhado/seguranca/hash.js';

test('logs escondem segredos mesmo quando a saída chega em várias partes', async t => {
  const f = await fixture(t);
  f.manifest.execution.envAllowlist = ['INTEGRACAO_TESTE'];
  const senha = 'segredo-que-nao-deve-vazar';
  const logs = mascararLogsDaExecucao(
    { raiz: f.root, manifesto: f.manifest },
    { INTEGRACAO_TESTE: senha },
    [Buffer.from('resultado '), Buffer.from('segredo-que-'), Buffer.from('nao-deve-vazar')],
    [Buffer.from('falhou: '), Buffer.from(senha)]
  );
  assert.ok(!logs.stdout.includes(senha));
  assert.ok(!logs.stderr.includes(senha));
  assert.match(logs.stdout, /\[REDACTED\]/);
  assert.match(logs.stderr, /\[REDACTED\]/);
});

test('relatório aprovado substitui o conteúdo bruto por casos já redigidos', async t => {
  const f = await fixture(t);
  const rel = '.prumo/resultados/job-fixture.json';
  const destino = path.join(f.root, '.prumo', 'resultados', 'job-fixture.json');
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, 'conteúdo bruto com segredo-de-teste');
  const e = { cases: [{ id: 'caso-1', status: 'PASS', evidence: '[REDACTED]' }], resultArtifact: { path: rel } };
  await gravarRelatorioRedigido({ raiz: f.root }, e, 'job-fixture', rel);
  const gravado = await readFile(destino, 'utf8');
  assert.equal(gravado, JSON.stringify({ jobId: 'job-fixture', cases: e.cases }, null, 2));
  assert.ok(!gravado.includes('segredo-de-teste'));
  assert.equal(e.resultArtifact.sha256, hash(gravado));
  assert.match(e.resultArtifact.trust, /redigido/);
});

test('artefato que não foi validado é apagado, sem resultado inventado', async t => {
  const f = await fixture(t);
  const rel = '.prumo/resultados/nao-validado.json';
  const destino = path.join(f.root, '.prumo', 'resultados', 'nao-validado.json');
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, 'conteúdo bruto não validado');
  const e = { cases: [], resultArtifact: null };
  await gravarRelatorioRedigido({ raiz: f.root }, e, 'job-invalido', rel);
  await assert.rejects(stat(destino), { code: 'ENOENT' });
  assert.equal(e.resultArtifact, null);
});

test('caminho relativo fora do projeto é rejeitado antes de qualquer gravação', async t => {
  const f = await fixture(t);
  const e = { cases: [], resultArtifact: { path: '../../fora.json' } };
  await assert.rejects(gravarRelatorioRedigido({ raiz: f.root }, e, 'job-fixture', '../../fora.json'));
});
