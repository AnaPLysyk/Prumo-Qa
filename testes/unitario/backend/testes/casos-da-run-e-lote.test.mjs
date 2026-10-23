/** Casos de uma run do Prumo (trocar, tirar, resultado em lote) com persistência em memória; sem perfil real, rede ou automação. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arquivos = new Map(); const pastas = [];
process.on('exit', () => { for (const p of pastas) fs.rmSync(p, { recursive: true, force: true }); });
mock.module('../../../../dist/compartilhado/banco/persistenciaLocal.js', { exports: {
  lerLocal: (nome, schema, padrao, base) => schema.parse(structuredClone(arquivos.get(base + nome) ?? padrao)),
  gravarLocal: (nome, dados, base) => arquivos.set(base + nome, structuredClone(dados))
} });
const { gravarRunsLocais, obterRunLocal } = await import('../../../../dist/testes/banco/runs.js');
const { editarRunLocal, casosComResultadoRemovidos, declararResultadosManuais } = await import('../../../../dist/testes/servicoExecucoes.js');
const { criarEspaco } = await import('../../../../dist/projetos/servicoProjetos.js');
const { runSchema } = await import('../../../../dist/testes/tipos/runLocal.js');
const { esquemasIpc } = await import('../../../../dist/aplicativo/api/catalogoDeContratos.js');

const em = '2026-10-22T12:00:00.000Z';
const manual = { status: 'PASS', origem: 'MANUAL', granularidade: 'DECLARADO', comentario: '', por: 'Pessoa', em };
const automatico = { status: 'FAIL', origem: 'EXECUCAO', granularidade: 'CENARIO', comentario: '', em };
const caso = (casoId, resultado = null, suite = 'Login') => ({ casoId, titulo: 'Caso ' + casoId, suite, capability: null, casoRunner: null, resultado, publicado: false });

async function preparar({ remota = false, casos = [caso(1, manual), caso(2), caso(3, automatico)] } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-run-')); pastas.push(base); const id = randomUUID(); const espaco = await criarEspaco({ nome: 'Projeto', descricao: '' }, base);
  const run = runSchema.parse({ id, espacoId: espaco.id, titulo: 'Run', ambiente: 'local', runIdRemoto: remota ? 55 : null, planoId: null, estado: remota ? 'CRIADA' : 'PREPARADA', confirmadaNoQase: remota, criadaEm: em, atualizadaEm: em, casos, execucoes: [], publicacoes: [] });
  gravarRunsLocais({ version: 1, itens: [run] }, base);
  return { base, id };
}

test('o caso da run guarda a suíte em que foi escolhido', async () => {
  const { base, id } = await preparar();
  assert.deepEqual(obterRunLocal(id, base).casos.map(c => c.suite), ['Login', 'Login', 'Login']);
});

test('trocar os casos mantém o resultado de quem fica e entra sem resultado quem chega', async () => {
  const { base, id } = await preparar();
  const run = editarRunLocal(id, { titulo: 'Run nova', ambiente: 'teste', casos: [{ casoId: 1, titulo: 'Caso 1' }, { casoId: 9, titulo: 'Caso 9', suite: 'Checkout' }] }, base);
  assert.deepEqual(run.casos.map(c => c.casoId), [1, 9]);
  assert.equal(run.casos[0].resultado.status, 'PASS', 'o resultado de quem ficou é preservado');
  assert.equal(run.casos[1].resultado, null);
  assert.equal(run.casos[1].suite, 'Checkout');
  assert.equal(run.titulo, 'Run nova');
});

test('sem a lista de casos só título e ambiente mudam', async () => {
  const { base, id } = await preparar();
  const run = editarRunLocal(id, { titulo: 'Só o título', ambiente: 'homologacao' }, base);
  assert.equal(run.casos.length, 3);
  assert.equal(run.ambiente, 'homologacao');
});

test('run criada no Qase não troca de casos e uma run não fica sem nenhum', async () => {
  const remota = await preparar({ remota: true });
  assert.throws(() => editarRunLocal(remota.id, { titulo: 'Run', ambiente: 'local', casos: [{ casoId: 1, titulo: 'x' }] }, remota.base), /RUN_CASES_LOCKED/);
  const local = await preparar();
  assert.throws(() => editarRunLocal(local.id, { titulo: 'Run', ambiente: 'local', casos: [] }, local.base), /RUN_WITHOUT_CASES/);
});

test('o aviso de confirmação lista só os casos que saem levando resultado', async () => {
  const { base, id } = await preparar();
  const saem = casosComResultadoRemovidos(id, [{ casoId: 2, titulo: 'Caso 2' }], base);
  assert.deepEqual(saem.map(c => c.casoId), [1, 3]);
  assert.deepEqual(casosComResultadoRemovidos(id, undefined, base), []);
});

test('resultado em lote vale para todos, exige comentário para falha e preserva o de automação', async () => {
  const { base, id } = await preparar();
  assert.throws(() => declararResultadosManuais(id, [1, 2], { status: 'FAIL', comentario: 'x' }, 'Pessoa', base), /MANUAL_COMMENT_REQUIRED/);
  const { run, mantidos } = declararResultadosManuais(id, [1, 2, 3], { status: 'BLOCKED', comentario: 'Ambiente fora do ar' }, 'Ana', base, new Date('2026-10-23T10:00:00Z'));
  assert.deepEqual(mantidos, [3], 'o caso com resultado de execução não é sobrescrito');
  assert.equal(run.casos[0].resultado.status, 'BLOCKED');
  assert.equal(run.casos[1].resultado.por, 'Ana');
  assert.equal(run.casos[2].resultado.origem, 'EXECUCAO');
  assert.throws(() => declararResultadosManuais(id, [99], { status: 'PASS', comentario: '' }, 'Ana', base), /RUN_CASE_NOT_FOUND/);
});

test('os canais aceitam a lista de casos e o lote, e recusam argumentos extras', async () => {
  const id = randomUUID();
  assert.equal(esquemasIpc['runs:editar'].safeParse({ id, titulo: 'Run nova', ambiente: 'teste', casos: [{ casoId: 1, titulo: 'x', suite: 'Login' }] }).success, true);
  assert.equal(esquemasIpc['runs:editar'].safeParse({ id, titulo: 'Run nova', ambiente: 'teste' }).success, true);
  assert.equal(esquemasIpc['runs:resultados'].safeParse({ id, casoIds: [1, 2], status: 'PASS', comentario: '' }).success, true);
  assert.equal(esquemasIpc['runs:resultados'].safeParse({ id, casoIds: [], status: 'PASS', comentario: '' }).success, false);
  assert.equal(esquemasIpc['runs:resultados'].safeParse({ id, casoIds: [1], status: 'PASS', comentario: '', extra: 1 }).success, false);
});
