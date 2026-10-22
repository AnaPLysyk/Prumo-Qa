/** O que o Prumo escreve num cenário vira, sem perda, o corpo que o Qase aceita (passos BDD, tags, campos de sistema). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { corpoDoCasoQase } from '../../../../dist/testes/integracoes/casosQase.js';
import { esquemaCaso, dadosCasoLocal, editarCaso, entradaRemoverCaso } from '../../../../dist/testes/tipos/escritaQase.js';

const cenario = {
  titulo: 'Cancelar pedido em aberto', descricao: 'Garante o cancelamento', preCondicoes: 'Cliente logado', posCondicoes: 'Sem cobrança pendente',
  passos: [
    { acao: 'que o pedido está aberto', formato: 'bdd', palavra: 'Dado' },
    { acao: 'o cliente cancela', formato: 'bdd', palavra: 'Quando', dados: 'motivo=desistência' },
    { acao: 'Abrir a tela', esperado: 'Tela aberta' }
  ],
  automacao: 'automatizado', tags: ['pedidos', 'regressao'], severidade: 3, prioridade: 1, tipo: 3, status: 0, comportamento: 1, camada: 1, instavel: false, suiteId: 12
};

test('o corpo enviado ao Qase leva passos BDD, tags e todos os campos de sistema', () => {
  const corpo = corpoDoCasoQase(esquemaCaso.parse(cenario));
  assert.equal(corpo.title, 'Cancelar pedido em aberto');
  assert.equal(corpo.preconditions, 'Cliente logado'); assert.equal(corpo.postconditions, 'Sem cobrança pendente');
  assert.deepEqual(corpo.steps.map(s => s.action), ['Dado que o pedido está aberto', 'Quando o cliente cancela', 'Abrir a tela']);
  assert.equal(corpo.steps[1].data, 'motivo=desistência'); assert.equal(corpo.steps[2].expected_result, 'Tela aberta');
  assert.deepEqual(corpo.tags, ['pedidos', 'regressao']);
  assert.equal(corpo.suite_id, 12); assert.equal(corpo.severity, 3); assert.equal(corpo.priority, 1); assert.equal(corpo.type, 3);
  assert.equal(corpo.status, 0); assert.equal(corpo.behavior, 1); assert.equal(corpo.layer, 1); assert.equal(corpo.is_flaky, 0);
  assert.equal(corpo.isManual, 0); assert.equal(corpo.isToBeAutomated, 0);
});

test('cenário manual sai como manual e campos não informados não são enviados', () => {
  const corpo = corpoDoCasoQase(esquemaCaso.parse({ titulo: 'Caso simples', passos: [{ acao: 'Abrir', esperado: 'Abriu' }] }));
  assert.equal(corpo.isManual, 1);
  for (const k of ['status', 'behavior', 'layer', 'is_flaky', 'severity', 'priority', 'type', 'suite_id']) assert.equal(k in corpo, false, k);
});

test('o mesmo cenário é aceito no repositório local (sem suíte do Qase) e rejeita valores inválidos', () => {
  const { suiteId, ...local } = cenario;
  assert.equal(dadosCasoLocal.parse(local).passos[0].palavra, 'Dado');
  assert.throws(() => esquemaCaso.parse({ ...cenario, passos: [{ acao: 'x', formato: 'bdd', palavra: 'Given' }] }));
  assert.throws(() => esquemaCaso.parse({ ...cenario, tags: ['com espaço'] }));
});

test('editar caso no Qase aceita os mesmos campos do formulário de criação e recusa edição vazia', () => {
  const p = editarCaso.parse({ casoId: 212, posCondicoes: 'x', tags: ['a'], severidade: 2, status: 1, comportamento: 2, camada: 3, instavel: true, passos: [{ acao: 'que existe', formato: 'bdd', palavra: 'Dado' }] });
  assert.equal(p.status, 1); assert.equal(p.passos[0].palavra, 'Dado');
  assert.throws(() => editarCaso.parse({ casoId: 212 }), /nenhuma alteração/);
});

test('remover caso do Prumo exige id do caso e do projeto e não aceita campos extras', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.doesNotThrow(() => entradaRemoverCaso.parse({ espacoId: id, id, remover: true }));
  assert.throws(() => entradaRemoverCaso.parse({ espacoId: id, id, remover: true, qase: true }));
  assert.throws(() => entradaRemoverCaso.parse({ espacoId: id, remover: true }));
});

test('valores de sistema fora da faixa do Qase e passo BDD sem palavra são recusados', () => {
  for (const campo of [{ severidade: 99 }, { prioridade: 4 }, { status: 3 }, { comportamento: 4 }, { camada: 9 }]) assert.throws(() => esquemaCaso.parse({ titulo: 'Caso valido', ...campo }), undefined, JSON.stringify(campo));
  assert.throws(() => esquemaCaso.parse({ titulo: 'Caso valido', passos: [{ acao: 'x', formato: 'bdd' }] }));
  assert.doesNotThrow(() => esquemaCaso.parse({ titulo: 'Caso valido', severidade: 6, prioridade: 3, status: 2, comportamento: 3, camada: 3 }));
});
