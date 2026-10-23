/** No CI, cada teste do Lab que falha vira uma anotação ::error pública com nome, local e erro; sem "not ok", a anotação mostra o fim da saída. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const script = path.resolve('site/release/anotar-falhas-dos-testes.mjs');
const anotar = (t, conteudo, rotulo) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo anotar falhas '));
  t.after(() => fs.rmSync(pasta, { recursive: true, force: true }));
  const arquivo = path.join(pasta, 'saida.log');
  fs.writeFileSync(arquivo, conteudo);
  return execFileSync(process.execPath, [script, arquivo, rotulo], { encoding: 'utf8' }).trim().split('\n');
};

test('CI: uma anotação por teste que falhou, com local e erro escapados para o GitHub', (t) => {
  const tap = ['TAP version 13', 'ok 1 - abre a tela', '  ---', '  duration_ms: 10', '  ...',
    'not ok 2 - run, 50% concluída: salva', '  ---', '  duration_ms: 3001.2', "  location: 'file:///D:/a/r.test.mjs:12:1'",
    '  error: |-', '    1 !== 2', "  code: 'ERR_ASSERTION'", '  ...', '1..2'].join('\n');
  const [linha, ...resto] = anotar(t, tap, 'Lab regressao (Windows)');
  assert.equal(resto.length, 0);
  assert.equal(linha, "::error title=Lab regressao (Windows)::run, 50%25 concluída: salva%0Alocation: 'file:///D:/a/r.test.mjs:12:1'%0Aerror: |-%0A1 !== 2");
});

test('CI: sem "not ok", a anotação traz o fim da saída do executor', (t) => {
  const [linha] = anotar(t, 'LAB_PRUMO_NAO_COMPILADO: execute npm run build\n', 'Lab: smoke, macOS');
  assert.match(linha, /^::error title=Lab%3A smoke%2C macOS::Nenhum "not ok" na saída/);
  assert.match(linha, /%0ALAB_PRUMO_NAO_COMPILADO: execute npm run build$/);
});
