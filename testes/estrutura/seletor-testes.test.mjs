/** Fixtures em memória verificam seleção e bloqueios sem lançar os testes selecionados. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { raiz, argumentos, selecionar, planoDeExecucao, validarCatalogo, arquivosDeTeste } from '../../ferramentas/testes/executar.mjs';
const fixture = { schemaVersion: 1, testes: [
  { arquivo: 'testes/a.test.mjs', camada: 'regra', natureza: ['unidade','seguranca'], funcionalidade: 'projetos', motivo: 'Regra sintética', evidencias: ['assertion fixture'], perfilReal: false },
  { arquivo: 'testes/b.test.mjs', camada: 'ui', natureza: ['e2e'], funcionalidade: 'projetos', motivo: 'Janela sintética', evidencias: ['fixture'], perfilReal: false },
  { arquivo: 'testes/c.test.mjs', camada: 'persistencia', natureza: ['migracao'], funcionalidade: 'instalacao', motivo: 'Perfil de instalação', evidencias: ['fixture'], perfilReal: true }
] };
test('catálogo cobre exatamente todos os arquivos reais', () => {
  const c = JSON.parse(fs.readFileSync(path.join(raiz, 'testes/catalogo.json'), 'utf8'));
  assert.equal(validarCatalogo(c, arquivosDeTeste()), c);
});
test('filtros combinam camada, natureza e funcionalidade com AND', () => {
  const { filtros, listar } = argumentos(['--camada','regra','--natureza','seguranca','--funcionalidade','projetos','--listar']);
  assert.equal(listar, true); assert.deepEqual(selecionar(fixture, filtros).map(t => t.arquivo), ['testes/a.test.mjs']);
  assert.throws(() => selecionar(fixture, { natureza: 'desconhecida' }), /TEST_FILTER_UNKNOWN/);
  assert.throws(() => argumentos(['--comando','qualquer']), /TEST_ARGUMENT_INVALID/);
});
test('runner mantém hook, não adiciona build e bloqueia perfil real', () => {
  const argv = planoDeExecucao([fixture.testes[0]], {});
  assert.ok(argv.includes('./testes/apoio/conhecimento-hook.cjs')); assert.ok(argv.includes('--test')); assert.ok(!argv.includes('build'));
  for (const env of [{ PRUMO_APP_EXE: 'app.exe' }, { PRUMO_MIGRACAO_26: '1' }, { PRUMO_MIGRACAO: '0' }]) assert.throws(() => planoDeExecucao([fixture.testes[0]], env), /TEST_REAL_PROFILE_BLOCKED/);
  assert.throws(() => planoDeExecucao([fixture.testes[2]], {}), /TEST_REAL_PROFILE_BLOCKED/);
  assert.throws(() => planoDeExecucao([], {}), /TEST_SELECTION_EMPTY/);
});
test('catálogo recusa duplicação, omissão e traversal', () => {
  assert.throws(() => validarCatalogo(fixture, ['testes/a.test.mjs']), /TEST_CATALOG_DIVERGENT/);
  const c = structuredClone(fixture); c.testes[0].arquivo = '../a.test.mjs';
  assert.throws(() => validarCatalogo(c, c.testes.map(t => t.arquivo)), /TEST_CATALOG_INVALID/);
});
