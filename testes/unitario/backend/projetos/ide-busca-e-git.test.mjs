/** IDE do repositório: busca, estado do Git e diff, sempre em pastas temporárias próprias. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buscarNoRepositorio } from '../../../../dist/projetos/ideRepositorio.js';
import { estadoDoGit, diferencaDoGit } from '../../../../dist/projetos/ideGit.js';

const ambiente = (t) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-ide-busca-'));
  t.after(() => fs.rmSync(pasta, { recursive: true, force: true }));
  return pasta;
};
const escrever = (raiz, rel, texto) => { fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true }); fs.writeFileSync(path.join(raiz, rel), texto); };
const temGit = spawnSync('git', ['--version']).status === 0;
const git = (cwd, ...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t.t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' });

test('busca respeita caixa, trechos e ordem, e ignora segredos, binários, gerados e atalhos', t => {
  const raiz = ambiente(t);
  escrever(raiz, 'src/app.ts', 'const Alvo = 1;\nconst alvo = 2;\n');
  escrever(raiz, '.env', 'alvo=segredo');
  escrever(raiz, 'node_modules/x/index.js', 'alvo');
  fs.writeFileSync(path.join(raiz, 'img.bin'), Buffer.concat([Buffer.from('alvo'), Buffer.from([0, 1])]));
  escrever(raiz, 'grande.txt', 'alvo\n' + 'x'.repeat(310_000));
  const sem = buscarNoRepositorio(raiz, 'ALVO');
  assert.deepEqual(sem.resultados.map(r => [r.arquivo, r.linha]), [['src/app.ts', 1], ['src/app.ts', 2]]);
  assert.equal(sem.truncado, false);
  const com = buscarNoRepositorio(raiz, 'Alvo', true);
  assert.deepEqual(com.resultados.map(r => r.linha), [1]);
  assert.equal(com.resultados[0].trecho, 'const Alvo = 1;');
});

test('busca por regex valida a expressão e recusa repetição aninhada e consulta enorme', t => {
  const raiz = ambiente(t);
  escrever(raiz, 'a.js', 'foo123\nbar\n');
  assert.deepEqual(buscarNoRepositorio(raiz, 'foo\\d+', false, true).resultados.map(r => r.linha), [1]);
  assert.throws(() => buscarNoRepositorio(raiz, '(', false, true), /IDE_BUSCA_REGEX_INVALIDA/);
  assert.throws(() => buscarNoRepositorio(raiz, '(a+)+$', false, true), /IDE_BUSCA_REGEX_INVALIDA/);
  assert.throws(() => buscarNoRepositorio(raiz, 'a'.repeat(201)), /IDE_BUSCA_INVALIDA/);
  assert.equal(buscarNoRepositorio(raiz, '(', false, false).resultados.length, 0); // modo literal
});

test('busca trunca em 500 resultados e limita o trecho a 200 caracteres', t => {
  const raiz = ambiente(t);
  escrever(raiz, 'muitos.txt', Array.from({ length: 700 }, () => 'achado ' + 'y'.repeat(300)).join('\n'));
  const r = buscarNoRepositorio(raiz, 'achado');
  assert.equal(r.resultados.length, 500);
  assert.equal(r.truncado, true);
  assert.ok(r.resultados.every(x => x.trecho.length <= 200));
});

test('busca mascara segredos dentro do trecho', t => {
  const raiz = ambiente(t);
  escrever(raiz, 'config.txt', 'senha = supersegredo123\n');
  const r = buscarNoRepositorio(raiz, 'senha');
  assert.doesNotMatch(r.resultados[0].trecho, /supersegredo123/);
});

test('git fora de repositório responde indisponível sem erro e o diff é recusado', async t => {
  const raiz = ambiente(t);
  escrever(raiz, 'a.txt', 'x');
  assert.deepEqual(await estadoDoGit(raiz), { disponivel: false, branch: null, alteracoes: [] });
  await assert.rejects(diferencaDoGit(raiz, 'a.txt'), /IDE_GIT_INDISPONIVEL/);
});

test('diff recusa caminhos maliciosos, segredos e opções disfarçadas', async t => {
  const raiz = ambiente(t);
  fs.mkdirSync(path.join(raiz, '.git'));
  for (const nome of ['../fora.txt', '/abs.txt', 'C:/x', '.env', 'src/../../x', '.git/config', 'a*.txt', ':(glob)**', 'a:b']) {
    await assert.rejects(diferencaDoGit(raiz, nome), /IDE_CAMINHO_INVALIDO/, nome);
  }
});

test('git mostra branch, estados e diff de modificado e de novo, sem alterar nada', { skip: !temGit }, async t => {
  const raiz = ambiente(t);
  assert.equal(git(raiz, 'init', '-q', '-b', 'principal').status, 0);
  escrever(raiz, 'a.txt', 'um\n');
  escrever(raiz, 'b.txt', 'dois\n');
  git(raiz, 'add', '.'); assert.equal(git(raiz, 'commit', '-q', '-m', 'i').status, 0);
  escrever(raiz, 'a.txt', 'um\nmais\n');
  escrever(raiz, 'novo dir/c.txt', 'novo\n');
  escrever(raiz, '.env', 'token=abc');
  fs.rmSync(path.join(raiz, 'b.txt'));
  git(raiz, 'add', 'a.txt');
  const antes = git(raiz, 'status', '--porcelain=v1').stdout;
  const e = await estadoDoGit(raiz);
  assert.equal(e.disponivel, true);
  assert.equal(e.branch, 'principal');
  const por = Object.fromEntries(e.alteracoes.map(a => [a.arquivo, a]));
  assert.deepEqual(por['a.txt'], { arquivo: 'a.txt', estado: 'modificado', preparado: true });
  assert.deepEqual(por['b.txt'], { arquivo: 'b.txt', estado: 'removido', preparado: false });
  assert.deepEqual(por['novo dir/c.txt'], { arquivo: 'novo dir/c.txt', estado: 'novo', preparado: false });
  assert.equal(por['.env'], undefined);
  const d = await diferencaDoGit(raiz, 'a.txt');
  assert.match(d.diff, /\+mais/);
  assert.equal(d.truncado, false);
  const n = await diferencaDoGit(raiz, 'novo dir/c.txt');
  assert.match(n.diff, /--- \/dev\/null/);
  assert.match(n.diff, /\+novo/);
  assert.equal(git(raiz, 'status', '--porcelain=v1').stdout, antes);
});
