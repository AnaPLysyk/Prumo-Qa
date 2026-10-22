/** Filtros da tela de Tickets chegam ao Jira como JQL fixada no projeto vinculado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { jqlDeTickets } from '../../../../dist/tickets/integracoesJira.js';
import { filtrosSchema } from '../../../../dist/conexoes/tipos/adaptador.js';

test('situação vira categoria de status pelo ID fixo do Jira, sem depender do nome do status', () => {
  assert.equal(jqlDeTickets('10001', { situacao: 'aberto' }), 'project = 10001 AND statusCategory = 2 ORDER BY updated DESC');
  assert.equal(jqlDeTickets('10001', { situacao: 'andamento' }), 'project = 10001 AND statusCategory = 4 ORDER BY updated DESC');
  assert.equal(jqlDeTickets('10001', { situacao: 'concluido', desde: '2026-10-16' }), 'project = 10001 AND statusCategory = 3 AND updated >= "2026-10-16" ORDER BY updated DESC');
});

test('situação só aceita os três valores da tela', () => {
  assert.equal(filtrosSchema.safeParse({ situacao: 'aberto' }).success, true);
  for (const ruim of ['Aberto', 'done', '2 OR project != 1', '']) assert.equal(filtrosSchema.safeParse({ situacao: ruim }).success, false, ruim);
});
