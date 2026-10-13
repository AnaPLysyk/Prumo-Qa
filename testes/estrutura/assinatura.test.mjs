import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const { assinar, montarArgumentos, procurarSigntool } = createRequire(import.meta.url)('../../ferramentas/empacotamento/assinar-windows.cjs');
const arquivo = path.resolve('release/win-unpacked/Prumo QA.exe');
const digital = 'a'.repeat(40);

test('sem credencial: não executa nada e o arquivo permanece não assinado (build não finge assinatura)', () => {
  let chamou = false;
  assert.equal(assinar({ path: arquivo }, {}, () => { chamou = true; return { status: 0 }; }), 'ignorado');
  assert.equal(chamou, false);
});

test('com credencial: chama o signtool sem shell, com SHA-256 e carimbo de tempo', () => {
  let visto;
  const r = assinar({ path: arquivo }, { PRUMO_ASSINATURA_THUMBPRINT: digital.toUpperCase(), PRUMO_SIGNTOOL: process.execPath }, (exe, args, opts) => { visto = { exe, args, opts }; return { status: 0 }; });
  assert.equal(r, 'assinado');
  assert.deepEqual(visto.args, ['sign', '/sha1', digital.toUpperCase(), '/fd', 'sha256', '/tr', 'http://timestamp.digicert.com/', '/td', 'sha256', arquivo]);
  assert.equal(visto.opts.shell, false);
});

test('com credencial, qualquer falha interrompe o build (nunca publica não assinado achando que assinou)', () => {
  const env = { PRUMO_ASSINATURA_THUMBPRINT: digital, PRUMO_SIGNTOOL: process.execPath };
  assert.throws(() => assinar({ path: arquivo }, env, () => ({ status: 1 })), /interrompido/);
  assert.throws(() => assinar({ path: arquivo }, env, () => ({ error: new Error('x'), status: null })), /interrompido/);
  assert.throws(() => assinar({ path: arquivo }, { PRUMO_ASSINATURA_THUMBPRINT: digital }, () => ({ status: 0 }), { existe: () => false, listar: () => [] }), /signtool\.exe não encontrado/);
  assert.throws(() => assinar({ path: arquivo }, { ...env, PRUMO_SIGNTOOL: path.join(path.resolve('nao-existe'), 'signtool.exe') }, () => ({ status: 0 })), /inexistente/);
});

test('entradas inválidas são recusadas: impressão digital, carimbo de tempo e caminho', () => {
  for (const ruim of ['', 'zz', 'a'.repeat(39), 'a'.repeat(41), digital + ' ; calc', '../../x']) assert.throws(() => montarArgumentos({ PRUMO_ASSINATURA_THUMBPRINT: ruim }, arquivo), /inválida/, ruim);
  assert.throws(() => montarArgumentos({ PRUMO_ASSINATURA_THUMBPRINT: digital, PRUMO_TIMESTAMP_URL: 'file:///c:/x' }, arquivo), /http\(s\)/);
  assert.throws(() => montarArgumentos({ PRUMO_ASSINATURA_THUMBPRINT: digital, PRUMO_TIMESTAMP_URL: 'não é url' }, arquivo), /inválida/);
  assert.throws(() => montarArgumentos({ PRUMO_ASSINATURA_THUMBPRINT: digital }, 'relativo.exe'), /absoluto/);
  assert.deepEqual(montarArgumentos({ PRUMO_ASSINATURA_THUMBPRINT: `${digital.slice(0, 20)} ${digital.slice(20)}` }, arquivo).slice(1, 3), ['/sha1', digital], 'espaços da impressão digital copiada do Windows são tolerados');
});

test('localização do signtool: variável explícita ou Windows SDK, sem inventar caminho', () => {
  assert.equal(procurarSigntool({ PRUMO_SIGNTOOL: process.execPath }), process.execPath);
  const achado = procurarSigntool({ 'ProgramFiles(x86)': 'X:\\pf' }, (c) => c.endsWith(path.join('10.0.22621.0', 'x64', 'signtool.exe')), () => ['10.0.19041.0', '10.0.22621.0']);
  assert.match(achado, /10\.0\.22621\.0/, 'usa a versão mais nova do SDK');
});

test('nenhum segredo, certificado ou chave privada no repositório; o gancho está ligado ao electron-builder', () => {
  const yml = fs.readFileSync('electron-builder.yml', 'utf8');
  assert.match(yml, /sign: ferramentas\/empacotamento\/assinar-windows\.cjs/);
  assert.doesNotMatch(yml, /certificateFile|certificatePassword|CSC_KEY_PASSWORD|WIN_CSC_LINK/i);
  const rastreados = fs.readdirSync('.', { recursive: true }).filter((f) => !/node_modules|\.git[\\/]|release|dist|\.prumo/.test(String(f)) && /\.(pfx|p12|pem|key|snk)$/i.test(String(f)));
  assert.deepEqual(rastreados, []);
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /\*\.pfx/);
});
