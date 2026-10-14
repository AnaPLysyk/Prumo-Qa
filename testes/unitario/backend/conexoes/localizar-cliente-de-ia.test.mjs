import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { localizarClienteDeIa } from '../../../../dist/conexoes/ia/localizarClienteDeIa.js';

// Pasta de usuário e PATH sintéticos: nenhum CLI real é procurado nem executado.
const emPerfilFalso = (t, montar) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo cli ')); t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  montar(raiz); const antes = { ...process.env }; Object.assign(process.env, { USERPROFILE: raiz, LOCALAPPDATA: path.join(raiz, 'local'), PATH: path.join(raiz, 'vazio'), Path: path.join(raiz, 'vazio') });
  t.after(() => { for (const k of ['USERPROFILE', 'LOCALAPPDATA', 'PATH', 'Path']) antes[k] === undefined ? delete process.env[k] : (process.env[k] = antes[k]); }); return raiz;
};
const executavel = (p) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, ''); };

test('Windows: o claude.exe da extensão do VS Code é encontrado (versão mais nova) e sem nada instalado volta null', { skip: process.platform !== 'win32' }, (t) => {
  emPerfilFalso(t, () => {});
  assert.equal(localizarClienteDeIa('claude'), null);
  const raiz = emPerfilFalso(t, (r) => { for (const v of ['2.1.9', '2.1.296']) executavel(path.join(r, '.vscode', 'extensions', `anthropic.claude-code-${v}-win32-x64`, 'resources', 'native-binary', 'claude.exe')); });
  const x = localizarClienteDeIa('claude'); assert.equal(x.shim, false); assert.equal(x.executable, path.join(raiz, '.vscode', 'extensions', 'anthropic.claude-code-2.1.296-win32-x64', 'resources', 'native-binary', 'claude.exe'), '2.1.296 é mais nova que 2.1.9 (ordem numérica, não alfabética)');
});
