import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// A tipografia do aplicativo vem de fontes embutidas e de dois tokens; nada de família de fonte solta nas telas.
const lerCss = (f) => fs.readFileSync(f, 'utf8');
const estilo = lerCss('frontend/design-system/estilo.css');
const cssDasTelas = (pasta = 'frontend') => fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
  const caminho = path.join(pasta, e.name);
  return e.isDirectory() ? (e.name === 'vendor' ? [] : cssDasTelas(caminho)) : e.name.endsWith('.css') ? [caminho] : [];
});

test('as fontes embutidas e as licenças existem, e o @font-face aponta para arquivos reais', () => {
  for (const arquivo of ['inter-latin-wght-normal.woff2', 'jetbrains-mono-latin-wght-normal.woff2', 'INTER-LICENSE.txt', 'JETBRAINS-MONO-LICENSE.txt']) assert.ok(fs.existsSync(path.join('assets/fontes', arquivo)), arquivo);
  const urls = [...estilo.matchAll(/@font-face[^}]*url\("([^"]+)"\)/g)].map((m) => m[1]); assert.equal(urls.length, 2);
  // estilo.css é publicado em dist/renderer/: ../../assets sai do renderer e chega em assets/ na raiz do aplicativo.
  for (const u of urls) assert.ok(fs.existsSync(path.join('dist/renderer', u)), u);
});

test('os tokens --fonte-ui e --fonte-mono começam pelas fontes embutidas e não apontam para si mesmos', () => {
  const ui = /--fonte-ui:\s*([^;]+);/.exec(estilo)?.[1] ?? ''; const mono = /--fonte-mono:\s*([^;]+);/.exec(estilo)?.[1] ?? '';
  assert.match(ui, /^"Inter Variable"/); assert.match(mono, /^"JetBrains Mono Variable"/);
  assert.doesNotMatch(ui, /var\(--fonte-ui\)/, 'um token que se referencia vira valor inválido e a janela cai na fonte padrão do navegador'); assert.doesNotMatch(mono, /var\(--fonte-mono\)/);
});

test('nenhuma tela declara família de fonte própria: tudo passa pelos tokens', () => {
  const soltas = [];
  for (const f of cssDasTelas()) for (const linha of lerCss(f).split('\n')) if (/Segoe UI|Consolas|Cascadia|system-ui|sans-serif|monospace/.test(linha) && !/--fonte-(ui|mono):/.test(linha)) soltas.push(f + ': ' + linha.trim().slice(0, 100));
  assert.deepEqual(soltas, []);
});

test('a política da janela libera fontes só do próprio aplicativo', () => {
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  assert.match(html, /font-src 'self'/); assert.doesNotMatch(html, /font-src[^;"]*(https?:|\*|data:)/);
});

test('o corpo não liga números tabulares no texto corrido', () => {
  assert.doesNotMatch(lerCss('frontend/design-system/qc.css'), /:root\s*\{[^}]*font-feature-settings:\s*"tnum"/);
});
