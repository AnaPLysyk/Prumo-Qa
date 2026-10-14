// As cores de tema (claro/escuro) moram só no Design System (frontend/design-system/). As telas usam os tokens e não têm
// ramos de tema nem paleta própria: mudar uma cor é mudar um arquivo, e nenhuma tela fica com fundo escuro no tema claro.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const frontend = path.join(raiz, 'frontend');
const cssDasTelas = fs.readdirSync(frontend, { recursive: true }).map(String).filter((r) => r.endsWith('.css') && !r.startsWith('design-system')).map((r) => [r.replaceAll('\\', '/'), fs.readFileSync(path.join(frontend, r), 'utf8')]);

test('design system: nenhuma tela tem ramo de tema (data-tema ou prefers-color-scheme) fora de frontend/design-system/', () => {
  assert.ok(cssDasTelas.length > 10, 'as folhas de estilo das telas foram encontradas');
  const comRamo = cssDasTelas.filter(([, t]) => /data-tema|prefers-color-scheme/.test(t)).map(([r]) => r);
  assert.deepEqual(comRamo, []);
});

test('design system: nenhuma tela redefine os tokens de tema (fundo, painel, linha, texto, suave, acento, estados)', () => {
  const redefine = cssDasTelas.flatMap(([r, t]) => [...t.matchAll(/(?:^|[{;])\s*(--(?:fundo2?|painel|linha|texto|suave|acento(?:-texto)?|ok|falha|aviso|neutro|qc-azul)):/g)].map((m) => r + ' ' + m[1]));
  assert.deepEqual(redefine, []);
});

test('design system: os tokens usados pelas telas para camadas, retrato e terminal existem nos dois temas', () => {
  const ds = fs.readFileSync(path.join(frontend, 'design-system', 'ds.css'), 'utf8');
  for (const token of ['--ds-rotulo', '--ds-mistura-retrato', '--ds-mistura-avatar', '--ds-sombra-curta', '--ds-terminal-fundo', '--ds-terminal-texto']) assert.match(ds, new RegExp(token + ':'), token);
  for (const token of ['--ds-mistura-retrato', '--ds-mistura-avatar', '--ds-terminal-fundo']) assert.equal(ds.split(token + ':').length - 1, 3, token + ' no escuro, no claro escolhido e no claro do sistema');
});
