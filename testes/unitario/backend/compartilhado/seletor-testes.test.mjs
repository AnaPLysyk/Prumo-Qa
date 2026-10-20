/** O projeto principal executa somente testes unitarios; suites de automacao residem no Prumo QA Lab. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { raiz, argumentos, selecionar, planoDeExecucao, descrever, catalogar, arquivosDeTeste } from '../../../../testes/unitario/executar.mjs';

const exemplos = catalogar([
  'testes/unitario/backend/projetos/a.test.mjs',
  'testes/unitario/frontend/projetos/b.test.mjs',
  'testes/unitario/frontend/aplicativo/c.test.mjs'
]);

test('os arquivos unitarios seguem pasta, camada e modulo existente', () => {
  const problemas = [];
  for (const arquivo of arquivosDeTeste()) {
    try {
      const t = descrever(arquivo);
      if (t.modulo !== 'compartilhado' &&
        !['backend', 'frontend'].some(c => fs.existsSync(path.join(raiz, c, t.modulo))))
        problemas.push(arquivo + ': modulo ausente');
    } catch (e) { problemas.push(e.message); }
  }
  assert.deepEqual(problemas, []);
});

test('apenas unitarios e auxiliares ficam no repositorio do aplicativo', () => {
  const itens = fs.readdirSync(path.join(raiz, 'testes'), { withFileTypes: true });
  assert.deepEqual(itens.filter(e => e.isFile()).map(e => e.name), []);
  assert.deepEqual(itens.filter(e => e.isDirectory()).map(e => e.name).sort(), ['apoio', 'unitario']);
  assert.ok(fs.readdirSync(path.join(raiz, 'testes', 'apoio')).every(n => !n.endsWith('.test.mjs')));
});

test('servidores HTTP reais e Electron pertencem ao Lab, não aos unitários', () => {
  const proibidos = [];
  for (const nome of arquivosDeTeste()) {
    const codigo = fs.readFileSync(path.join(raiz, nome), 'utf8');
    if (/\b(?:http|https)\.createServer\s*\(|\b(?:servidor|server)\.listen\s*\(|\belectron\.launch\s*\(/.test(codigo)) proibidos.push(nome);
  }
  assert.deepEqual(proibidos, []);
});

test('filtros de unidade combinam natureza, camada e modulo e recusam natureza externa', () => {
  const { filtros, listar } = argumentos(['--natureza', 'unitario', '--camada', 'frontend', '--modulo', 'projetos', '--listar']);
  assert.equal(listar, true);
  assert.deepEqual(selecionar(exemplos, filtros).map(t => t.arquivo), ['testes/unitario/frontend/projetos/b.test.mjs']);
  assert.throws(() => selecionar(exemplos, { natureza: 'regressao' }), /TEST_FILTER_UNKNOWN/);
  assert.throws(() => argumentos(['--comando', 'qualquer']), /TEST_ARGUMENT_INVALID/);
  assert.throws(() => descrever('testes/regressao/frontend/projetos/x.test.mjs'), /TEST_PATH_INVALID/);
});

test('selecao ampla executa somente unidades, sem ignorar casos sintéticos', () => {
  const unidade = selecionar(exemplos, { natureza: 'unitario' });
  assert.deepEqual(unidade.map(x => x.arquivo), exemplos.map(x => x.arquivo));
  assert.deepEqual(planoDeExecucao(unidade, {}).slice(-3), unidade.map(t => t.arquivo));
});

test('runner preserva hook, nao compila de novo e recusa perfil instalado', () => {
  const argv = planoDeExecucao([exemplos[0]], {});
  assert.ok(argv.includes('./testes/apoio/conhecimento-hook.cjs'));
  assert.ok(argv.includes('--test'));
  assert.ok(!argv.includes('build'));
  for (const env of [{ PRUMO_APP_EXE: 'app.exe' }, { PRUMO_MIGRACAO_26: '1' }, { PRUMO_MIGRACAO: '0' }])
    assert.throws(() => planoDeExecucao([exemplos[0]], env), /TEST_REAL_PROFILE_BLOCKED/);
  assert.throws(() => planoDeExecucao([], {}), /TEST_SELECTION_EMPTY/);
});
