/** O contrato de vincular/importar aceita o recurso exatamente como o serviço o devolve; o campo extra da lista é só da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

const recurso = { id: '10000', chave: 'KAN', nome: 'Qa', instancia: 'https://empresa.atlassian.net', contaId: 'conta', tipoId: 'id_api' };
const ids = { espacoId: '11111111-1111-4111-8111-111111111111', conexaoId: '22222222-2222-4222-8222-222222222222' };

test('vincular e importar aceitam o recurso puro e recusam o campo usadoPor que só a lista da tela carrega', () => {
  assert.ok(esquemasIpc['projetos:vincular'].safeParse({ ...ids, recurso }).success);
  assert.ok(esquemasIpc['projetos:importar'].safeParse({ conexaoId: ids.conexaoId, recurso }).success);
  assert.equal(esquemasIpc['projetos:vincular'].safeParse({ ...ids, recurso: { ...recurso, usadoPor: null } }).success, false);
  assert.equal(esquemasIpc['projetos:importar'].safeParse({ conexaoId: ids.conexaoId, recurso: { ...recurso, usadoPor: { id: 'x', nome: 'Y' } } }).success, false);
});
