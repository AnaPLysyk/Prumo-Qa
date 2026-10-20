/** Impede que uma reorganização deixe consumidores com imports locais ausentes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verificarDependencias } from '../../../../docs/geradores/dependencias.mjs';

test('arquitetura: todos os imports locais do backend resolvem para fontes existentes', () => {
  const resultado = verificarDependencias(process.cwd());
  assert.ok(resultado.arestas.length > 0);
  assert.deepEqual(resultado.problemas, []);
});

test('arquitetura: remoção de helper compartilhado identifica todos os consumidores', (t) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo dependencias '));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  fs.writeFileSync(path.join(raiz, 'tsconfig.json'), JSON.stringify({ compilerOptions: { module: 'NodeNext', moduleResolution: 'NodeNext' }, include: ['*.ts'] }));
  for (const nome of ['logs', 'terminal']) fs.writeFileSync(path.join(raiz, `${nome}.ts`), "export { descreverAchados } from './helper.js';\n");
  fs.writeFileSync(path.join(raiz, 'helper.ts'), 'export const descreverAchados = () => [];\n');
  assert.equal(verificarDependencias(raiz).arestas.length, 2);
  fs.unlinkSync(path.join(raiz, 'helper.ts'));
  const resultado = verificarDependencias(raiz);
  assert.deepEqual(resultado.problemas.map((p) => p.arquivo), ['logs.ts', 'terminal.ts']);
  assert.ok(resultado.problemas.every((p) => p.linha === 1 && p.import === './helper.js'));
});
