import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { analisarVersao } from '../../../../dist/ajuda/versoes/analisarVersao.js';
import { apresentarVersoes } from '../../../../dist/ajuda/versoes/apresentarVersoes.js';
import { carregarVersoes } from '../../../../dist/ajuda/versoes/carregarVersoes.js';
import { compararVersoes } from '../../../../dist/ajuda/versoes/compararVersoes.js';
import { conferirInstalada } from '../../../../dist/ajuda/versoes/conferirInstalada.js';
import { enderecoDaVersao as urlRelease } from '../../../../dist/ajuda/versoes/enderecoDaVersao.js';
import { notasDaVersao } from '../../../../dist/ajuda/versoes/notasDaVersao.js';
import { validarVersoes } from '../../../../dist/ajuda/versoes/validarVersoes.js';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const bruto = () => JSON.parse(fs.readFileSync('docs/catalogo/versoes.json', 'utf8'));

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
  const versoes = carregarVersoes('docs/catalogo/versoes.json');
  assert.deepEqual(versoes.map((v) => v.version).slice(-4), ['2.3.0', '2.2.0', '2.1.0', '2.0.0'], 'as versões históricas permanecem');
  conferirInstalada(versoes, pkg.version);
  assert.equal(versoes[0].version, pkg.version, 'a versão mais nova do histórico é a do package.json');
  assert.match(fs.readFileSync('electron-builder.yml', 'utf8'), /artifactName: Prumo-QA-Setup-\$\{version\}\.exe/);
  for (const v of versoes.filter((x) => x.status === 'publicada')) assert.equal(v.releaseUrl, urlRelease(v.version));
});

test('cada versão explica funcionalidades, diferencial, segurança, compatibilidade, limitações e migração', () => {
  for (const v of carregarVersoes('docs/catalogo/versoes.json')) {
    assert.ok(v.objective.length > 30 && v.differential.length > 20 && v.migration.length > 0, v.version);
    assert.ok(v.features.length > 0 && v.limitations.length > 0 && v.compatibility.length > 0 && v.security.length > 0, v.version);
  }
});

test('histórico confere com o Git: tag e release só existem para versões marcadas como publicadas', () => {
  const tags = execFileSync('git', ['tag'], { encoding: 'utf8' }).split(/\s+/).filter(Boolean);
  for (const v of carregarVersoes('docs/catalogo/versoes.json')) {
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
  const v = Object.fromEntries(carregarVersoes('docs/catalogo/versoes.json').map((x) => [x.version, x]));
  assert.equal(v['2.0.0'].releaseUrl, null); assert.equal(v['2.1.0'].releaseUrl, null);
  assert.equal(v['2.2.0'].status, 'publicada'); assert.equal(v['2.2.0'].date, '2026-10-10');
  if (v['2.3.0'].status === 'planejada') assert.equal(v['2.3.0'].date, null);
});

test('validação rejeita inconsistências', () => {
  const faz = (f) => { const b = bruto(); f(b); return () => validarVersoes(b); };
  const v = (b, n) => b.versions.find((x) => x.version === n);
  assert.throws(faz((b) => b.versions.reverse()), /VERSIONS_ORDER/);
  assert.throws(faz((b) => b.versions.push({ ...b.versions[0] })), /VERSIONS_ORDER/);
  assert.throws(faz((b) => { v(b, '2.2.0').releaseUrl = 'https://github.com/outro/repo/releases/tag/v2.2.0'; }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { v(b, '2.2.0').date = null; }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { v(b, '2.3.0').status = 'planejada'; }), /VERSIONS_INCONSISTENT/, 'planejada não pode ter data nem release');
  assert.throws(faz((b) => { v(b, '2.3.0').releaseUrl = null; }), /VERSIONS_INCONSISTENT/, 'publicada exige o link oficial');
  assert.throws(faz((b) => { v(b, '2.1.0').releaseUrl = urlRelease('2.1.0'); }), /VERSIONS_INCONSISTENT/);
  assert.throws(faz((b) => { b.versions[0].extra = 1; }));
  assert.throws(faz((b) => { b.versions[0].version = '2.3'; }));
  assert.throws(faz((b) => { b.schemaVersion = 2; }));
  assert.throws(() => conferirInstalada(carregarVersoes('docs/catalogo/versoes.json'), '9.9.9'), /VERSIONS_MISSING/);
});

test('versão em execução vira "instalada"; as demais mantêm o estado da fonte', () => {
  const r = apresentarVersoes(carregarVersoes('docs/catalogo/versoes.json'), '2.2.0');
  assert.equal(r.find((v) => v.version === '2.2.0').state, 'instalada');
  assert.equal(r.find((v) => v.version === '2.3.0').state, 'publicada');
  assert.equal(apresentarVersoes(carregarVersoes('docs/catalogo/versoes.json'), '2.3.0').find((v) => v.version === '2.3.0').state, 'instalada');
  assert.equal(r.find((v) => v.version === '2.1.0').state, 'repositorio');
});

test('notas de release saem da mesma fonte, sem copiar texto à mão', () => {
  const v = carregarVersoes('docs/catalogo/versoes.json')[0];
  const notas = notasDaVersao(v);
  assert.match(notas, new RegExp(`## Prumo QA ${v.version.replaceAll('.', '\\.')}`));
  for (const f of v.features.slice(0, 2)) assert.ok(notas.includes(f));
  assert.ok(notas.includes(v.differential) && notas.includes('Limitações conhecidas') && notas.includes('Migração de dados'));
  const gerado = execFileSync(process.execPath, ['site/release/notas-versao.mjs', v.version], { encoding: 'utf8' });
  assert.ok(gerado.includes(notas.trim().split('\n')[0]) && gerado.includes('NÃO ASSINADO') && gerado.includes('SHA-256'));
  assert.throws(() => execFileSync(process.execPath, ['site/release/notas-versao.mjs', '9.9.9'], { stdio: 'pipe' }));
});

test('notas de release só afirmam "assinado" quando o pipeline confirmou (PRUMO_ASSINADO=true); por padrão dizem NÃO ASSINADO', () => {
  const rodar = (extra) => execFileSync(process.execPath, ['site/release/notas-versao.mjs', '2.3.1'], { encoding: 'utf8', env: { ...process.env, PRUMO_ASSINADO: '', ...extra } });
  const padrao = rodar({});
  assert.match(padrao, /Instalador NÃO ASSINADO/); assert.doesNotMatch(padrao, /assinado digitalmente \(Authenticode/);
  assert.match(rodar({ PRUMO_ASSINADO: 'false' }), /NÃO ASSINADO/);
  assert.match(rodar({ PRUMO_ASSINADO: 'sim' }), /NÃO ASSINADO/, 'só o texto exato "true" vale');
  const assinado = rodar({ PRUMO_ASSINADO: 'true' });
  assert.match(assinado, /assinado digitalmente \(Authenticode/); assert.doesNotMatch(assinado, /Instalador NÃO ASSINADO/);
  assert.match(assinado, /não\*\* substitui uma assinatura digital/, 'o checksum continua sem ser tratado como assinatura');
});

test('catálogo: toda versão com tag publicada no Git está marcada como publicada, com o link oficial (exceto a versão em preparação)', async () => {
  const { execFileSync } = await import('node:child_process'); const fs = await import('node:fs');
  let tags = []; try { tags = execFileSync('git', ['tag', '--list', 'v[0-9]*.[0-9]*.[0-9]*'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean); } catch { /* sem Git: nada a conferir */ }
  const pacote = JSON.parse(fs.readFileSync('package.json', 'utf8')).version; const catalogo = JSON.parse(fs.readFileSync('docs/catalogo/versoes.json', 'utf8')).versions;
  for (const tag of tags) {
    const versao = tag.slice(1); if (versao === pacote) continue; const v = catalogo.find((x) => x.version === versao); if (!v) continue;
    assert.equal(v.status, 'publicada', `${versao} tem tag ${tag} e não pode ficar como "${v.status}": o site e o aplicativo anunciariam a versão errada`);
    assert.equal(v.releaseUrl, `https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/${tag}`);
  }
  // A versão anunciada pelo site é a primeira marcada como publicada
  assert.ok(catalogo.find((x) => x.status === 'publicada'));
});
