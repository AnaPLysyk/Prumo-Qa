/** A limpeza do build apaga só compilados sem fonte dentro de dist/ e preserva a interface, a Documentação Viva e o broker. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { limparCompilados } from '../../../../site/release/limpar-compilados.mjs';

function criar(raiz, arquivos) {
  for (const arquivo of arquivos) {
    fs.mkdirSync(path.dirname(path.join(raiz, arquivo)), { recursive: true });
    fs.writeFileSync(path.join(raiz, arquivo), 'x');
  }
}

test('build: apaga compilados sem fonte e preserva os com fonte, renderer, documentacao e o broker', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo limpar compilados '));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  const preservados = [
    'backend/aplicativo.ts', 'backend/modulos/regras/sessao.ts',
    'dist/aplicativo.js', 'dist/aplicativo.d.ts', 'dist/aplicativo.js.map', 'dist/modulos/regras/sessao.js',
    'dist/renderer/app.js', 'dist/renderer/vendor/three-0.159.0.min.js', 'dist/renderer/telas/inicio/inicio.js', 'dist/renderer/status.css',
    'dist/documentacao/mapa.json', 'dist/documentacao/codigo.json', 'dist/aprovar.exe', 'dist/aprovar.exe.fonte.sha256',
    'frontend/app.js', 'fora.js'
  ];
  const semFonte = ['dist/acoesProposta.js', 'dist/acoesProposta.d.ts', 'dist/acoesProposta.js.map', 'dist/contas/api/contaEntrar.js', 'dist/modulos/regras/antiga.js'];
  criar(raiz, [...preservados, ...semFonte]);
  const apagados = limparCompilados(path.join(raiz, 'dist'), path.join(raiz, 'backend'));
  assert.deepEqual(apagados.sort(), semFonte.map((a) => a.slice('dist/'.length)).sort());
  for (const arquivo of preservados) assert.ok(fs.existsSync(path.join(raiz, arquivo)), 'preservado: ' + arquivo);
  for (const arquivo of semFonte) assert.equal(fs.existsSync(path.join(raiz, arquivo)), false, 'apagado: ' + arquivo);
  assert.equal(fs.existsSync(path.join(raiz, 'dist/contas')), false, 'pasta que ficou vazia sai junto');
});

test('build: a limpeza recusa qualquer pasta que não seja dist/ e tolera dist/ ausente', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo limpar compilados '));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  criar(raiz, ['frontend/x.js']);
  assert.throws(() => limparCompilados(raiz, path.join(raiz, 'backend')), /só a pasta dist/);
  assert.throws(() => limparCompilados(path.join(raiz, 'frontend'), path.join(raiz, 'backend')), /só a pasta dist/);
  assert.ok(fs.existsSync(path.join(raiz, 'frontend/x.js')));
  assert.deepEqual(limparCompilados(path.join(raiz, 'dist'), path.join(raiz, 'backend')), []);
});
