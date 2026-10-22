import test from 'node:test';
import assert from 'node:assert/strict';
import { camposDe, catalogo, esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

test('o catálogo de contratos monta todos os canais, inclusive os de esquema com união (sem lançar)', () => {
  assert.doesNotThrow(() => catalogo());
  const ipc = catalogo().filter((o) => o.tipo === 'IPC');
  assert.equal(ipc.length, Object.keys(esquemasIpc).length, 'um item de catálogo por canal');
  for (const [nome, esquema] of Object.entries(esquemasIpc)) assert.ok(Array.isArray(camposDe(esquema)), nome);
});
