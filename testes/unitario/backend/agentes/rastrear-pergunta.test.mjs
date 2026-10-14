// Cérebro › Testar uma pergunta: o rastro usa as mesmas funções do chat (roteamento, orquestração, Skill) e não grava nada.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { rastrearPergunta } from '../../../../dist/agentes/chat/rastrearPergunta.js';
import { escolherAgente } from '../../../../dist/agentes/chat/escolherAgente.js';
import { planejarOrquestracao } from '../../../../dist/agentes/chat/planejarOrquestracao.js';
import { skillDoAgente } from '../../../../dist/agentes/chat/skillDoAgente.js';

const base = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-rastro-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };

test('rastro: "oi" vai para o Prumo Orchestrator, sem orquestração, e o agente em foco não responde', (t) => {
  const r = rastrearPergunta('oi', null, 'api-rest', base(t));
  assert.equal(r.escolhido.id, 'orquestrador'); assert.equal(r.orquestracao, null);
  assert.equal(r.foco.agente, 'api-rest'); assert.equal(r.foco.responderia, false);
  assert.ok(r.rota.every((z) => z.pontos > 0), 'a rota só lista quem pontuou');
});

test('rastro: pergunta de duas especialidades mostra a mesma orquestração que o chat faria, com as palavras que casaram', (t) => {
  const q = 'quais falhas aconteceram e como está a regressão?'; const r = rastrearPergunta(q, null, null, base(t));
  const chat = escolherAgente(q, null, {});
  assert.deepEqual(r.orquestracao, planejarOrquestracao(chat.rota)); assert.deepEqual(r.orquestracao, ['investigacao-bugs', 'regressao']);
  assert.equal(r.escolhido.id, chat.agente.id); assert.equal(r.foco, null);
  for (const z of r.rota) assert.equal(z.pontos, z.casou.reduce((n, c) => n + c.pontos, 0) + (z.mencao ? 10 : 0) + z.aprendidos, `pontos de ${z.agente} batem com o detalhe`);
  assert.deepEqual(r.rota.map((z) => z.agente), chat.rota.map((z) => z.agente));
});

test('rastro: o agente em foco usaria exatamente os trechos de Skill que o chat mandaria à IA', (t) => {
  const d = base(t); const q = 'como estão os testes de api e o contrato do endpoint?';
  const r = rastrearPergunta(q, null, 'api-rest', d);
  assert.equal(r.foco.responderia, true); assert.deepEqual(r.foco.skill.usados, skillDoAgente('api-rest', q, d).usados);
  assert.ok(r.foco.skill.usados.length > 0);
});

test('rastro: menção explícita decide e aparece como menção', (t) => {
  const r = rastrearPergunta('@playwright oi', null, 'playwright', base(t));
  assert.equal(r.escolhido.id, 'playwright'); assert.equal(r.rota[0].mencao, true); assert.equal(r.foco.responderia, true);
});

test('rastro: não grava conversa, atendimento nem orquestração', (t) => {
  const d = base(t); rastrearPergunta('quais falhas aconteceram e como está a regressão?', null, 'regressao', d);
  const gravados = fs.readdirSync(d, { recursive: true }).map(String);
  assert.ok(!gravados.some((n) => /orquestracoes|conversas|atendimentos/.test(n)), 'nada de conversa ou orquestração: ' + gravados.join(', '));
});
