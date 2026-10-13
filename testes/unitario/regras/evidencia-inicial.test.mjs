/** Garante que o início de uma execução ainda não simula autorização nem resultado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEvidenciaInicial } from '../../../dist/execucoes/regras/criarEvidenciaInicial.js';

test('evidência começa bloqueada, sem execução, autorização ou resultado inventado', () => {
  const projeto = { raiz: 'C:/fixture-projeto', manifestoHash: 'hash-do-contrato', manifesto: { id: 'projeto-fixture' } };
  const e = criarEvidenciaInicial(projeto, 'test-ui', 'job-fixture', '2026-10-12T00:00:00.000Z');
  assert.equal(e.status, 'BLOCKED');
  assert.equal(e.executed, false);
  assert.equal(e.approval, null);
  assert.equal(e.command, null);
  assert.equal(e.resultArtifact, null);
  assert.deepEqual(e.cases, []);
  assert.equal(e.projectId, 'projeto-fixture');
  assert.equal(e.capability, 'test-ui');
  assert.equal(e.jobId, 'job-fixture');
  assert.equal(e.endedAt, e.startedAt);
});
