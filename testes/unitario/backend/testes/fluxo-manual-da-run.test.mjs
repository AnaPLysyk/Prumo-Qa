/** Regras manuais com persistência em memória; sem perfil real, rede ou execução de automação. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const arquivos = new Map();
mock.module('../../../../dist/compartilhado/banco/persistenciaLocal.js', { exports: {
  lerLocal: (nome, schema, padrao, base) => schema.parse(structuredClone(arquivos.get(base + nome) ?? padrao)),
  gravarLocal: (nome, dados, base) => arquivos.set(base + nome, structuredClone(dados))
} });
const { iniciarAndamentoManual, listarAndamentoManual } = await import('../../../../dist/testes/banco/andamentoManual.js');
const { gravarRunsLocais, obterRunLocal } = await import('../../../../dist/testes/banco/runs.js');
const { declararResultadoManual } = await import('../../../../dist/testes/servicoExecucoes.js');
const { runSchema, paraQase } = await import('../../../../dist/testes/tipos/runLocal.js');
const { esquemasIpc } = await import('../../../../dist/aplicativo/api/catalogoDeContratos.js');

const em = '2026-10-22T12:00:00.000Z';
const pessoa = { id: randomUUID(), nome: 'Pessoa de teste', login: 'pessoa-fixture' };
const alvo = { espacoId: randomUUID(), runId: randomUUID(), vinculoId: 'local' };
const caso = { casoId: 7, titulo: 'Validar um formulário', capability: null, casoRunner: null, resultado: null, publicado: false };
function preparar(resultado = null) {
  const base = randomUUID();
  const run = runSchema.parse({ id: alvo.runId, espacoId: alvo.espacoId, titulo: 'Run manual', ambiente: 'local', runIdRemoto: null, planoId: null, estado: 'PREPARADA', confirmadaNoQase: false, criadaEm: em, atualizadaEm: em, casos: [{ ...caso, resultado }], execucoes: [], publicacoes: [] });
  gravarRunsLocais({ version: 1, itens: [run] }, base);
  return base;
}

test('iniciar e reabrir preserva a pessoa e o início, sem declarar resultado', () => {
  const base = preparar();
  const a = iniciarAndamentoManual(alvo, 7, pessoa, base, new Date(em));
  const b = iniciarAndamentoManual(alvo, 7, { ...pessoa, nome: 'Outra pessoa' }, base, new Date('2026-10-22T13:00:00Z'));
  assert.deepEqual(b, a);
  assert.deepEqual(listarAndamentoManual(alvo, base), [a]);
  assert.equal(obterRunLocal(alvo.runId, base).casos[0].resultado, null);
  assert.equal(listarAndamentoManual({ ...alvo, espacoId: randomUUID() }, base).length, 0);
  assert.equal(listarAndamentoManual({ ...alvo, vinculoId: 'outra-conexao' }, base).length, 0);
  assert.equal(listarAndamentoManual({ ...alvo, runId: 'qase-7' }, base).length, 0);
});

test('os cinco resultados persistem como declaração manual e têm mapeamento exato para Qase', () => {
  for (const [status, remoto] of [['PASS', 'passed'], ['FAIL', 'failed'], ['BLOCKED', 'blocked'], ['SKIPPED', 'skipped'], ['INVALID', 'invalid']]) {
    const base = preparar();
    declararResultadoManual(alvo.runId, 7, { status, comentario: 'Resultado observado' }, pessoa.nome, base, new Date(em));
    const c = obterRunLocal(alvo.runId, base).casos[0];
    assert.deepEqual(c.resultado, { status, comentario: 'Resultado observado', origem: 'MANUAL', granularidade: 'DECLARADO', por: pessoa.nome, em });
    assert.equal(c.publicado, false);
    assert.equal(paraQase[status], remoto);
  }
});

test('aprovar e pular aceitam comentário vazio; falha, bloqueio e inválido exigem observação', () => {
  for (const status of ['PASS', 'SKIPPED']) {
    const base = preparar();
    assert.doesNotThrow(() => declararResultadoManual(alvo.runId, 7, { status, comentario: '' }, pessoa.nome, base));
  }
  for (const status of ['FAIL', 'BLOCKED', 'INVALID', 'INVENTADO']) {
    const base = preparar();
    assert.throws(() => declararResultadoManual(alvo.runId, 7, { status, comentario: '' }, pessoa.nome, base), /MANUAL_(COMMENT_REQUIRED|STATUS_INVALID)/);
    assert.equal(obterRunLocal(alvo.runId, base).casos[0].resultado, null);
  }
});

test('corrigir resultado manual permite edição; automação com resultado continua protegida', () => {
  const base = preparar();
  declararResultadoManual(alvo.runId, 7, { status: 'FAIL', comentario: 'Falhou antes' }, pessoa.nome, base);
  declararResultadoManual(alvo.runId, 7, { status: 'PASS', comentario: '' }, pessoa.nome, base);
  assert.equal(obterRunLocal(alvo.runId, base).casos[0].resultado.status, 'PASS');
  const resultado = { status: 'FAIL', origem: 'EXECUCAO', granularidade: 'CENARIO', evidenciaId: randomUUID(), comentario: 'Falha do runner', em };
  const protegida = preparar(resultado);
  assert.throws(() => declararResultadoManual(alvo.runId, 7, { status: 'PASS', comentario: '' }, pessoa.nome, protegida), /RESULT_FROM_EXECUTION/);
  assert.deepEqual(obterRunLocal(alvo.runId, protegida).casos[0].resultado, resultado);
  assert.throws(() => declararResultadoManual(alvo.runId, 99, { status: 'PASS', comentario: '' }, pessoa.nome, base), /RUN_CASE_NOT_FOUND/);
});

test('contrato de início não aceita autoria forjada nem outro formato de run', () => {
  const schema = esquemasIpc['runs:andamento'];
  assert.equal(schema.safeParse({ espacoId: alvo.espacoId, runId: 'qase-42', casoId: 7 }).success, true);
  assert.equal(schema.safeParse({ espacoId: alvo.espacoId, runId: alvo.runId }).success, true);
  assert.equal(schema.safeParse({ espacoId: alvo.espacoId, runId: '../fora', casoId: 7 }).success, false);
  assert.equal(schema.safeParse({ espacoId: alvo.espacoId, runId: alvo.runId, casoId: 7, por: pessoa }).success, false);
});
