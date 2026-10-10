import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compararVersoes, analisarVersao, carregarVersoes, validarVersoes, conferirInstalada, apresentarVersoes, notasDaVersao, urlRelease } from '../dist/versoes.js';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const bruto = () => JSON.parse(fs.readFileSync('app/versoes.json', 'utf8'));

test('comparação semântica usa números, não texto', () => {
  assert.ok(compararVersoes('2.10.0', '2.9.0') > 0);
  assert.ok(compararVersoes('2.2.0', '2.3.0') < 0);
  assert.equal(compararVersoes('v2.3.0', '2.3.0'), 0);
  assert.ok(compararVersoes('3.0.0', '2.99.99') > 0);
  assert.deepEqual(analisarVersao('1.2.3'), [1, 2, 3]);
  for (const ruim of ['', '2', '2.3', '2.3.0-beta', '2.3.0.1', 'v', 'a.b.c', '02.3.0', '2.3.x']) assert.equal(analisarVersao(ruim), null, ruim);
  assert.throws(() => compararVersoes('2.3', '2.3.0'), /INVALID_VERSION/);
});

test('fonte de versões é válida, ordenada e coerente com package.json, tag e instalador', () => {
  const versoes = carregarVersoes('app/versoes.json');
  assert.deepEqual(versoes.map((v) => v.version), ['2.3.0', '2.2.0', '2.1.0', '2.0.0']);
  conferirInstalada(versoes, pkg.version);
  assert.equal(versoes[0].version, pkg.version, 'a versão mais nova do histórico é a do package.json');
  assert.match(fs.readFileSync('electron-builder.yml', 'utf8'), /artifactName: Prumo-QA-Setup-\$\{version\}\.exe/);
  for (const v of versoes.filter((x) => x.status === 'publicada')) assert.equal(v.releaseUrl, urlRelease(v.version));
});

test('cada versão explica funcionalidades, diferencial, segurança, compatibilidade, limitações e migração', () => {
  for (const v of carregarVersoes('app/versoes.json')) {
    assert.ok(v.objective.length > 30 && v.differential.length > 20 && v.migration.length > 0, v.version);
    assert.ok(v.features.length > 0 && v.limitations.length > 0 && v.compatibility.length > 0 && v.security.length > 0, v.version);
  }
});

test('histórico confere com o Git: tag e release só existem para versões marcadas como publicadas', () => {
  const tags = execFileSync('git', ['tag'], { encoding: 'utf8' }).split(/\s+/).filter(Boolean);
  for (const v of carregarVersoes('app/versoes.json')) {
    if (v.status === 'publicada' && process.env.CI !== 'true' && tags.length) assert.ok(tags.includes('v' + v.version), `tag v${v.version} ausente`);
    // Uma versão planejada só pode ter tag enquanto a própria release está sendo construída (a tag aponta para o HEAD);
    // depois de publicada, a fonte passa a "publicada". Tag antiga apontando para outro commit com a versão ainda planejada é inconsistência.
    if (v.status === 'planejada' && tags.includes('v' + v.version)) {
      const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
      assert.equal(git('rev-parse', `v${v.version}^{commit}`), git('rev-parse', 'HEAD'), `${v.version} está planejada mas sua tag aponta para outro commit`);
    }
  }
});

test('2.0 a 2.2 não inventam datas nem releases; 2.3 não é publicada sem release real', () => {
  const v = Object.fromEntries(carregarVersoes('app/versoes.json').map((x) => [x.version, x]));
  assert.equal(v['2.0.0'].releaseUrl, null); assert.equal(v['2.1.0'].releaseUrl, null);
  assert.equal(v['2.2.0'].status, 'publicada'); assert.equal(v['2.2.0'].date, '2026-10-10');
  if (v['2.3.0'].status === 'planejada') assert.equal(v['2.3.0'].date, null);
});

test('validação rejeita inconsistências', () => {
  const faz = (f) => { const b = bruto(); f(b); return () => validarVersoes(b); };
  assert.throws(faz((b) => b.versions.reverse()), /VERSIONS_ORDER/);
  assert.throws(faz((b) => b.versions.push({ ...b.versions[0] })), /VERSIONS_ORDER/);
  assert.throws(faz((b) => { b.versions[1].releaseUrl = 'https://github.com/outro/repo/releases/tag/v2.2.0'; }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { b.versions[1].date = null; }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { b.versions[0].status = 'planejada'; }), /VERSIONS_INCONSISTENT/, 'planejada não pode ter data nem release');
  assert.throws(faz((b) => { b.versions[0].releaseUrl = null; }), /VERSIONS_INCONSISTENT/, 'publicada exige o link oficial');
  assert.throws(faz((b) => { b.versions[2].releaseUrl = urlRelease('2.1.0'); }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { b.versions[0].extra = 1; }));
  assert.throws(faz((b) => { b.versions[0].version = '2.3'; }));
  assert.throws(faz((b) => { b.schemaVersion = 2; }));
  assert.throws(() => conferirInstalada(carregarVersoes('app/versoes.json'), '9.9.9'), /VERSIONS_MISSING/);
});

test('versão em execução vira "instalada"; as demais mantêm o estado da fonte', () => {
  const r = apresentarVersoes(carregarVersoes('app/versoes.json'), '2.2.0');
  assert.equal(r.find((v) => v.version === '2.2.0').state, 'instalada');
  assert.equal(r.find((v) => v.version === '2.3.0').state, 'publicada');
  assert.equal(apresentarVersoes(carregarVersoes('app/versoes.json'), '2.3.0').find((v) => v.version === '2.3.0').state, 'instalada');
  assert.equal(r.find((v) => v.version === '2.1.0').state, 'repositorio');
});

test('notas de release saem da mesma fonte, sem copiar texto à mão', () => {
  const v = carregarVersoes('app/versoes.json')[0];
  const notas = notasDaVersao(v);
  assert.match(notas, new RegExp(`## Prumo QA ${v.version.replaceAll('.', '\\.')}`));
  for (const f of v.features.slice(0, 2)) assert.ok(notas.includes(f));
  assert.ok(notas.includes(v.differential) && notas.includes('Limitações conhecidas') && notas.includes('Migração de dados'));
  const gerado = execFileSync(process.execPath, ['scripts/notas-versao.mjs', v.version], { encoding: 'utf8' });
  assert.ok(gerado.includes(notas.trim().split('\n')[0]) && gerado.includes('NÃO ASSINADO') && gerado.includes('SHA-256'));
  assert.throws(() => execFileSync(process.execPath, ['scripts/notas-versao.mjs', '9.9.9'], { stdio: 'pipe' }));
});
