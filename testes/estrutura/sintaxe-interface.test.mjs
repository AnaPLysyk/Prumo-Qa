// Um parêntese a mais numa parte de tela derruba o bundle inteiro e a janela volta às telas antigas sem erro visível.
// Aqui cada script carregado pela janela (app/renderer, gerado no build) precisa compilar.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const renderer = path.join(raiz, 'app', 'renderer');

test('interface: todo script da janela (app/renderer/*.js) compila', () => {
  const scripts = fs.readdirSync(renderer).filter((n) => n.endsWith('.js'));
  assert.ok(scripts.includes('interfaces-v36.js') && scripts.includes('ds.js'), 'os bundles foram gerados pelo build');
  const falhas = [];
  for (const n of scripts) { try { new vm.Script(fs.readFileSync(path.join(renderer, n), 'utf8'), { filename: n }); } catch (e) { falhas.push(n + ': ' + e.message); } }
  assert.deepEqual(falhas, []);
});
