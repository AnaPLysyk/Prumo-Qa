/** Organização por natureza/camada/módulo e seleção de testes, verificadas só com nomes de arquivo (nada é executado). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { raiz, argumentos, selecionar, planoDeExecucao, descrever, catalogar, arquivosDeTeste } from '../../../../testes/apoio/executar.mjs';
const fixture = catalogar(['testes/unitario/backend/projetos/a.test.mjs', 'testes/regressao/frontend/projetos/b.test.mjs', 'testes/regressao/frontend/aplicativo/migracao-x.test.mjs']);

test('todo teste fica em testes/<unitario|smoke|regressao>/<backend|frontend>/<modulo>/ e o módulo é uma pasta de tela', () => {
  const problemas = [];
  for (const arquivo of arquivosDeTeste()) {
    try { const t = descrever(arquivo); if (t.modulo !== 'compartilhado' && !['backend', 'frontend'].some((c) => fs.existsSync(path.join(raiz, c, t.modulo)))) problemas.push(`${arquivo}: não existe backend/${t.modulo}/ nem frontend/${t.modulo}/`); }
    catch (erro) { problemas.push(erro.message); }
  }
  assert.deepEqual(problemas, []);
});

test('nada solto em testes/; auxiliares ficam em testes/apoio/ e sem casos de teste', () => {
  const raizDosTestes = fs.readdirSync(path.join(raiz, 'testes'), { withFileTypes: true });
  assert.deepEqual(raizDosTestes.filter((e) => e.isFile()).map((e) => e.name), []);
  assert.deepEqual(raizDosTestes.filter((e) => e.isDirectory()).map((e) => e.name).sort(), ['apoio', 'regressao', 'smoke', 'unitario']);
  assert.ok(fs.readdirSync(path.join(raiz, 'testes', 'apoio')).every((n) => !n.endsWith('.test.mjs')));
});

test('filtros combinam natureza, camada e módulo com AND e recusam o desconhecido', () => {
  const { filtros, listar } = argumentos(['--natureza', 'regressao', '--camada', 'frontend', '--modulo', 'projetos', '--listar']);
  assert.equal(listar, true); assert.deepEqual(selecionar(fixture, filtros).map((t) => t.arquivo), ['testes/regressao/frontend/projetos/b.test.mjs']);
  assert.throws(() => selecionar(fixture, { natureza: 'e2e' }), /TEST_FILTER_UNKNOWN/);
  assert.throws(() => argumentos(['--comando', 'qualquer']), /TEST_ARGUMENT_INVALID/);
  assert.throws(() => descrever('testes/e2e/ui/x.test.mjs'), /TEST_PATH_INVALID/);
});

test('seleção ampla vai inteira para a execução, inclusive teste sintético de migração', () => {
  const regressao = selecionar(fixture, { natureza: 'regressao' });
  assert.deepEqual(regressao.map((t) => t.arquivo), [fixture[1].arquivo, fixture[2].arquivo]);
  assert.deepEqual(planoDeExecucao(regressao, {}).slice(-2), regressao.map((t) => t.arquivo));
});

test('runner mantém o hook, não adiciona build e recusa o perfil instalado no ambiente', () => {
  const argv = planoDeExecucao([fixture[0]], {});
  assert.ok(argv.includes('./testes/apoio/conhecimento-hook.cjs')); assert.ok(argv.includes('--test')); assert.ok(!argv.includes('build'));
  for (const env of [{ PRUMO_APP_EXE: 'app.exe' }, { PRUMO_MIGRACAO_26: '1' }, { PRUMO_MIGRACAO: '0' }]) assert.throws(() => planoDeExecucao([fixture[0]], env), /TEST_REAL_PROFILE_BLOCKED/);
  assert.throws(() => planoDeExecucao([], {}), /TEST_SELECTION_EMPTY/);
});
