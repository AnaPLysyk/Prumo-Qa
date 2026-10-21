// As cores de tema (claro/escuro) moram só no Design System (frontend/design-system/). As telas usam os tokens e não têm
// ramos de tema nem paleta própria: mudar uma cor é mudar um arquivo, e nenhuma tela fica com fundo escuro no tema claro.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const frontend = path.join(raiz, 'frontend');
const cssDasTelas = fs.readdirSync(frontend, { recursive: true }).map(String).filter((r) => r.endsWith('.css') && !r.split(path.sep).join('/').startsWith('design-system/') && !r.split(path.sep).join('/').includes('/vendor/')).map((r) => [r.replaceAll('\\', '/'), fs.readFileSync(path.join(frontend, r), 'utf8')]);

test('design system: nenhuma tela tem ramo de tema (data-tema ou prefers-color-scheme) fora de frontend/design-system/', () => {
  assert.equal(cssDasTelas.length, 0, 'estilos próprios devem estar apenas no Design System');
  const comRamo = cssDasTelas.filter(([, t]) => /data-tema|prefers-color-scheme/.test(t)).map(([r]) => r);
  assert.deepEqual(comRamo, []);
});

test('design system: nenhuma tela redefine os tokens de tema (fundo, painel, linha, texto, suave, acento, estados)', () => {
  const redefine = cssDasTelas.flatMap(([r, t]) => [...t.matchAll(/(?:^|[{;])\s*(--(?:fundo2?|painel|linha|texto|suave|acento(?:-texto)?|ok|falha|aviso|neutro|qc-azul)):/g)].map((m) => r + ' ' + m[1]));
  assert.deepEqual(redefine, []);
});

// Bug de 21/10/2026: em "Seguir sistema" com o Windows claro a cor de destaque não mudava, porque só existia a variante
// [data-tema="claro"]. Toda regra do tema claro escolhido precisa da mesma regra no claro do sistema.
test('design system: cada regra do tema claro tem a equivalente em "Seguir sistema" com o sistema claro', () => {
  const pasta = path.join(frontend, 'design-system');
  const faltando = [];
  for (const nome of fs.readdirSync(pasta).filter((n) => n.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(pasta, nome), 'utf8');
    const blocosDoSistema = [];
    for (const m of css.matchAll(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{/g)) {
      let nivel = 1, i = m.index + m[0].length; const inicio = i;
      while (nivel && i < css.length) { if (css[i] === '{') nivel++; else if (css[i] === '}') nivel--; i++; }
      blocosDoSistema.push(css.slice(inicio, i));
    }
    const doSistema = blocosDoSistema.join('\n');
    const seletores = [...css.matchAll(/([^{}]*\[data-tema="claro"\][^{}]*)\{/g)].flatMap((m) => m[1].split(',')).map((s) => s.replace(/\/\*[\s\S]*?\*\//g, '').trim())
      .filter((s) => s.includes('[data-tema="claro"]') && !s.includes(':not([data-tema="claro"])'));
    for (const s of seletores) {
      const variantes = [s.replace('[data-tema="claro"]', ':not([data-tema="escuro"]):not([data-tema="claro"])'), s.replace('[data-tema="claro"]', ':not([data-tema="escuro"])')];
      if (!variantes.some((v) => doSistema.includes(v))) faltando.push(nome + ': ' + s);
    }
  }
  assert.deepEqual(faltando, []);
});

test('design system: os tokens usados pelas telas para camadas, retrato e terminal existem nos dois temas', () => {
  const ds = fs.readFileSync(path.join(frontend, 'design-system', 'ds.css'), 'utf8');
  for (const token of ['--ds-rotulo', '--ds-mistura-retrato', '--ds-mistura-avatar', '--ds-sombra-curta', '--ds-terminal-fundo', '--ds-terminal-texto']) assert.match(ds, new RegExp(token + ':'), token);
  for (const token of ['--ds-mistura-retrato', '--ds-mistura-avatar', '--ds-terminal-fundo']) assert.equal(ds.split(token + ':').length - 1, 3, token + ' no escuro, no claro escolhido e no claro do sistema');
});

test('design system: Floating UI funciona offline com licença e foco preservado', () => {
  const html = fs.readFileSync(path.join(frontend, 'compartilhado/runtime/index.html'), 'utf8');
  const js = fs.readFileSync(path.join(frontend, 'design-system/ds.js'), 'utf8');
  const css = fs.readFileSync(path.join(frontend, 'design-system/ds.css'), 'utf8');
  const recursos = JSON.parse(fs.readFileSync(path.join(frontend, 'recursos.json'), 'utf8')).recursos;
  const arquivo = 'frontend/compartilhado/vendor/floating-ui-1.8.0.min.js';
  const biblioteca = fs.statSync(path.join(raiz, arquivo));
  const licenca = fs.readFileSync(path.join(frontend, 'compartilhado/vendor/FLOATING-UI-LICENSE.txt'), 'utf8');
  assert.ok(biblioteca.size > 1000 && biblioteca.size < 45000, 'bundle local pequeno');
  assert.match(licenca, /MIT License/);
  assert.ok(recursos.some(r => r.fonte === arquivo && r.destino === 'dist/renderer/vendor/floating-ui-1.8.0.min.js'));
  assert.ok(recursos.some(r => /FLOATING-UI-LICENSE/.test(r.fonte)));
  const script = html.indexOf('vendor/floating-ui-1.8.0.min.js');
  const ds = html.indexOf('src="ds.js"');
  assert.ok(script > 0 && script < ds, 'biblioteca antes do Design System');
  for (const detalhe of ['aria-describedby', "strategy: 'fixed'", 'f.autoUpdate', 'f.flip(', 'f.shift(', "e.key !== 'Escape'"]) assert.ok(js.includes(detalhe), detalhe);
  assert.match(css, /\.ds-info-texto\[data-flutuante\]\s*\{/);
});
