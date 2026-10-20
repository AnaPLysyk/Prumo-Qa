/** Confere a auditoria local e a revisão independente no Orquestrador do Prumo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditarPorAgentes, conferirScripts, localizarArquivosLongos } from '../../../../testes/apoio/auditoria-por-agentes.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const temporario = t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-agentes-auditoria-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test('revisor detecta referências a scripts que deixaram de existir', t => {
  const dir = temporario(t);
  fs.mkdirSync(path.join(dir, 'frontend/compartilhado/runtime'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'frontend/agentes'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'frontend/agentes/ativo.js'), '');
  fs.writeFileSync(path.join(dir, 'frontend/compartilhado/runtime/index.html'),
    '<script src="telas/agentes/ativo.js"></script><script src="telas/agentes/antigo.js"></script>');
  assert.deepEqual(conferirScripts(dir), ['agentes/antigo.js']);
});

test('inspeção sinaliza arquivo longo, mas não o apaga', t => {
  const dir = temporario(t);
  fs.mkdirSync(path.join(dir, 'backend/testes'), { recursive: true });
  const arquivo = path.join(dir, 'backend/testes/contrato.ts');
  fs.writeFileSync(arquivo, ('const texto = "válido";\n').repeat(360));
  assert.equal(localizarArquivosLongos(dir, ['backend/testes/contrato.ts']).length, 1);
  assert.ok(fs.existsSync(arquivo));
});

test('Prumo delega inspeção e revisão aos agentes internos em etapas distintas', async () => {
  const resultado = await auditarPorAgentes(raiz, {
    executarGit: () => '',
    dependencias: () => ({ problemas: [{ arquivo: 'backend/testes/exemplo.ts', linha: 3, import: './ausente.js' }] })
  });
  assert.equal(resultado.orquestrador, 'orquestrador');
  assert.deepEqual(resultado.registro.etapas.map(x => x.agente), ['investigacao-bugs', 'regressao']);
  assert.deepEqual(resultado.registro.etapas.map(x => x.estado), ['CONCLUIDA', 'CONCLUIDA']);
  assert.equal(resultado.agentes[1].status, 'PENDENCIAS');
  assert.match(resultado.agentes[1].pendencias.join(' '), /import ausente/);
  assert.equal(resultado.testes, 'NAO_EXECUTADOS_POR_ESTA_AUDITORIA');
});
