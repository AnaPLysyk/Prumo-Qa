import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// A concordância mora em frontend/compartilhado/runtime/i18n.js (script de janela, sem módulo): extrai a função e a executa isolada.
const fonte = fs.readFileSync('frontend/compartilhado/runtime/i18n.js', 'utf8');
const inicio = fonte.indexOf('function concordar(texto) {'); assert.ok(inicio > 0, 'função concordar encontrada');
const concordar = new Function(fonte.slice(inicio, fonte.indexOf('\n}', inicio) + 2) + '; return concordar;')();

test('um fica no singular; zero e mais de um vão para o plural', () => {
  assert.equal(concordar('1 ticket(s)'), '1 ticket');
  assert.equal(concordar('3 ticket(s)'), '3 tickets');
  assert.equal(concordar('0 run(s)'), '0 runs');
  assert.equal(concordar('1 vínculo(s)'), '1 vínculo');
});

test('(ões) e (is) seguem a regra do português, inclusive na palavra seguinte', () => {
  assert.equal(concordar('1 execução(ões)'), '1 execução');
  assert.equal(concordar('4 execução(ões)'), '4 execuções');
  assert.equal(concordar('0 ticket(s) local(is) neste computador'), '0 tickets locais neste computador');
  assert.equal(concordar('1 ticket(s) local(is) neste computador'), '1 ticket local neste computador');
});

test('sem número antes, ou sem marcador, o texto não muda', () => {
  assert.equal(concordar('Informe o ticket(s) desejado'), 'Informe o ticket(s) desejado');
  assert.equal(concordar('12 itens consultados'), '12 itens consultados');
  assert.equal(concordar('consultado 15/10/2026, 09:23:52'), 'consultado 15/10/2026, 09:23:52');
});
