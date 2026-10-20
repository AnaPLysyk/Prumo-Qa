import test from 'node:test';
import assert from 'node:assert/strict';
import { mascarar } from '../../../../dist/compartilhado/seguranca/mascarar.js';
import { respostaDaFerramentaMcp } from '../../../../dist/agentes/mcp/respostaDaFerramentaMcp.js';
import { abrirEspacoDeAutorizacoes } from '../../../../dist/agendamentos/autorizacoes/estadoERevogacao.js';

test('tokens GitHub fine-grained e Atlassian são mascarados mesmo sem rótulo', () => {
  for (const token of ['github_pat_' + 'a'.repeat(35), 'ATATT' + 'b'.repeat(40)]) assert.equal(mascarar('valor ' + token), 'valor [REDACTED]');
});

test('erro MCP preserva código contratual, mascara mensagem e aceita rejeição sem Error', async () => {
  const erro = Object.assign(new Error('token=segredo-sintetico'), { codigo: 'PATH_FORBIDDEN' });
  const r = await respostaDaFerramentaMcp(async () => { throw erro; });
  assert.equal(r.isError, true);
  assert.equal(r.content[0].text, 'PATH_FORBIDDEN: token=[REDACTED]');
  const n = await respostaDaFerramentaMcp(async () => { throw null; });
  assert.equal(n.content[0].text, 'null');
});

test('limite de autorizações preserva todas as vigentes e libera só a mais antiga inativa', () => {
  const registros = Array.from({ length: 300 }, (_, id) => ({ id, criadaEm: String(id).padStart(3, '0'), vigente: id > 1 }));
  const livres = abrirEspacoDeAutorizacoes(registros, x => x.vigente);
  assert.equal(livres.length, 299);
  assert.ok(!livres.some(x => x.id === 0));
  assert.ok(livres.some(x => x.id === 1));
  assert.equal(livres.filter(x => x.vigente).length, 298);
  assert.equal(registros.length, 300);
  assert.equal(abrirEspacoDeAutorizacoes(registros, () => true).length, 300);
});
