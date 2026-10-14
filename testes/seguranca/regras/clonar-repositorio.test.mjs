/** Trazer o repositório do GitHub para o computador: só github.com por https, git sem hooks, atualização só por avanço. Os testes usam um repositório local, sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { clonarOuAtualizarRepositorio, repositorioValido } from '../../../dist/projetos/regras/clonarRepositorio.js';

const identidade = { GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test' };
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env: { ...process.env, ...identidade }, encoding: 'utf8' });
const pasta = (t) => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-clone-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };
function origem(t) {
  const o = pasta(t); git(o, 'init', '-q', '-b', 'main'); fs.mkdirSync(path.join(o, 'tests')); fs.writeFileSync(path.join(o, 'tests/a.spec.ts'), 'um\n'); git(o, 'add', '.'); git(o, 'commit', '-q', '-m', 'um');
  return o;
}
const local = { protocolo: 'file', limiteMs: 60_000 };

test('repositorioValido aceita dono/repositorio do GitHub e recusa o que muda o endereço', () => {
  for (const ok of ['AnaPLysyk/Prumo-Qa', 'a/b', 'org-1/repo.nome_2']) assert.equal(repositorioValido(ok), true, ok);
  for (const ruim of ['', 'so', 'a/b/c', '../x/y', 'a/../b', 'a/b c', 'a/b;rm', '-a/b', 'a/', '/b', 'a\\b', 'a/b?x=1', 'a/b#x', 'x'.repeat(101) + '/y']) assert.equal(repositorioValido(ruim), false, JSON.stringify(ruim));
});

test('só aceita endereço https://github.com/dono/repositorio.git no modo de produção', async (t) => {
  const d = pasta(t);
  for (const ruim of ['http://github.com/a/b.git', 'https://evil.example/a/b.git', 'https://github.com/a/b', 'https://github.com/a/b/c.git', 'file:///x', 'ssh://git@github.com/a/b.git', '-oProxyCommand=x', 'https://github.com@evil.example/a/b.git'])
    await assert.rejects(() => clonarOuAtualizarRepositorio(ruim, path.join(d, 'x')), /GIT_URL_INVALID/, ruim);
  assert.deepEqual(fs.readdirSync(d), [], 'nada foi criado');
});

test('clona, depois atualiza só por avanço e recusa pasta alheia, outro remoto e divergência', async (t) => {
  const o = origem(t); const d = pasta(t); const destino = path.join(d, 'repo');
  const r = await clonarOuAtualizarRepositorio(o, destino, local);
  assert.equal(r.acao, 'clonado'); assert.equal(r.ramo, 'main'); assert.equal(fs.readFileSync(path.join(destino, 'tests/a.spec.ts'), 'utf8'), 'um\n');
  fs.writeFileSync(path.join(o, 'tests/a.spec.ts'), 'dois\n'); git(o, 'commit', '-qam', 'dois');
  const u = await clonarOuAtualizarRepositorio(o, destino, local);
  assert.equal(u.acao, 'atualizado'); assert.equal(fs.readFileSync(path.join(destino, 'tests/a.spec.ts'), 'utf8'), 'dois\n');
  // outro remoto na mesma pasta
  const outra = origem(t); await assert.rejects(() => clonarOuAtualizarRepositorio(outra, destino, local), /CLONE_REMOTE_MISMATCH/);
  // pasta existente que não é repositório
  const alheia = path.join(d, 'alheia'); fs.mkdirSync(alheia); fs.writeFileSync(path.join(alheia, 'x.txt'), 'meu');
  await assert.rejects(() => clonarOuAtualizarRepositorio(o, alheia, local), /CLONE_DESTINATION_BUSY/); assert.equal(fs.readFileSync(path.join(alheia, 'x.txt'), 'utf8'), 'meu');
  // divergência: commit local e commit novo na origem não se juntam por avanço, e o trabalho local fica intacto
  fs.writeFileSync(path.join(destino, 'local.spec.ts'), 'meu\n'); git(destino, 'add', '.'); git(destino, 'commit', '-q', '-m', 'local');
  fs.writeFileSync(path.join(o, 'tests/a.spec.ts'), 'tres\n'); git(o, 'commit', '-qam', 'tres');
  await assert.rejects(() => clonarOuAtualizarRepositorio(o, destino, local), /CLONE_CANNOT_FAST_FORWARD/);
  assert.equal(fs.readFileSync(path.join(destino, 'local.spec.ts'), 'utf8'), 'meu\n');
});

test('clone que falha não deixa a pasta pela metade', async (t) => {
  const d = pasta(t); const destino = path.join(d, 'repo');
  await assert.rejects(() => clonarOuAtualizarRepositorio(path.join(d, 'nao-existe'), destino, local), /GIT_/);
  assert.equal(fs.existsSync(destino), false);
});

test('sem o git instalado a mensagem diz o que fazer', async (t) => {
  const antes = { P: process.env.PATH, p: process.env.Path };
  t.after(() => { if (antes.P !== undefined) process.env.PATH = antes.P; if (antes.p !== undefined) process.env.Path = antes.p; });
  process.env.PATH = ''; process.env.Path = '';
  const d = pasta(t);
  await assert.rejects(() => clonarOuAtualizarRepositorio('https://github.com/a/b.git', path.join(d, 'x')), /GIT_UNAVAILABLE: o git não foi encontrado/);
});
