// Orquestrador observável: planejamento por pontuação, etapas registradas (inclusive falha), resposta consolidada e registro sem texto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planejarOrquestracao } from '../../../../dist/agentes/chat/roteamento.js';
import { orquestrar } from '../../../../dist/agentes/chat/orquestrar.js';
import { conversar } from '../../../../dist/agentes/chat/conversar.js';
import { registrarOrquestracao, arquivoDeOrquestracoes } from '../../../../dist/agentes/banco/orquestracao.js';
import { listarOrquestracoes } from '../../../../dist/agentes/banco/orquestracao.js';
import { agentesChat } from '../../../../dist/agentes/tipos/persona.js';

const base = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-orq-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };
const agente = (id) => agentesChat.find((a) => a.id === id);

test('planejar: dois ou mais especialistas com sinal forte; nunca o orquestrador; no máximo três', () => {
  assert.deepEqual(planejarOrquestracao([{ agente: 'regressao', pontos: 3 }, { agente: 'investigacao-bugs', pontos: 4 }]), ['investigacao-bugs', 'regressao']);
  assert.equal(planejarOrquestracao([{ agente: 'regressao', pontos: 5 }, { agente: 'monitoramento', pontos: 2 }]), null, 'sinal fraco não chama outro agente');
  assert.equal(planejarOrquestracao([{ agente: 'orquestrador', pontos: 9 }, { agente: 'regressao', pontos: 3 }]), null);
  assert.equal(planejarOrquestracao([{ agente: 'a', pontos: 3 }, { agente: 'b', pontos: 3 }, { agente: 'c', pontos: 3 }, { agente: 'd', pontos: 3 }]).length, 3);
});

test('orquestrar: cada etapa tem ordem, tempo, fontes e estado; a falha de um agente não interrompe os outros e é mascarada', async () => {
  let relogio = Date.parse('2026-10-13T10:00:00Z'); const agora = () => new Date(relogio += 5);
  const responder = async (a) => {
    if (a.id === 'regressao') throw new Error('falhou com token=abc123secretoXYZ');
    if (a.id === 'monitoramento') return { linhas: ['Não encontrei nada.'], fontes: [], fatos: [], vazio: true };
    return { linhas: ['Últimas falhas: login.', 'Hipótese: ambiente.'], fontes: [{ rotulo: 'Execuções', aba: 'execucoes' }], fatos: ['falhas=1'], vazio: false };
  };
  const { coleta, registro } = await orquestrar([agente('investigacao-bugs'), agente('regressao'), agente('monitoramento')], [{ agente: 'investigacao-bugs', pontos: 4 }], 'pergunta com SEGREDO-NA-PERGUNTA', null, undefined, responder, agora);
  assert.deepEqual(registro.etapas.map((e) => [e.ordem, e.agente, e.estado]), [[1, 'investigacao-bugs', 'CONCLUIDA'], [2, 'regressao', 'FALHOU'], [3, 'monitoramento', 'SEM_DADOS']]);
  assert.equal(registro.estado, 'PARCIAL'); assert.equal(registro.dependencias, 'INDEPENDENTES'); assert.equal(registro.responsavel, 'orquestrador');
  assert.ok(registro.etapas.every((e) => e.duracaoMs > 0 && e.fim > e.inicio));
  assert.doesNotMatch(registro.etapas[1].erro, /abc123secretoXYZ/);
  assert.doesNotMatch(JSON.stringify(registro), /SEGREDO-NA-PERGUNTA|Últimas falhas/, 'o registro não guarda pergunta nem resposta');
  assert.match(coleta.linhas.join('\n'), /Investigação[\s\S]*Últimas falhas[\s\S]*não consegui consultar[\s\S]*não encontrou dados/);
  assert.deepEqual(coleta.fontes.map((f) => f.aba), ['execucoes']);
});

test('chat: pergunta de duas especialidades vira orquestração registrada; com agente escolhido pela pessoa, não', async (t) => {
  const b = base(t);
  const r = await conversar({ espacoId: null, pergunta: 'quais falhas aconteceram e como está a regressão?', base: b });
  assert.equal(r.agente.id, 'orquestrador'); assert.deepEqual(r.orquestracao.agentes, ['investigacao-bugs', 'regressao']);
  assert.match(r.linhas.join('\n'), /2 especialistas/);
  const lista = listarOrquestracoes(null, b); assert.equal(lista.orquestracoes.length, 1); assert.equal(lista.orquestracoes[0].id, r.orquestracao.id);
  const direto = await conversar({ espacoId: null, pergunta: 'quais falhas aconteceram e como está a regressão?', agente: 'regressao', base: b });
  assert.equal(direto.agente.id, 'regressao'); assert.equal(direto.orquestracao, undefined);
  assert.equal(listarOrquestracoes(null, b).orquestracoes.length, 1);
});

test('registro: guarda os 500 mais recentes, separa por projeto e conta linhas inválidas sem quebrar', (t) => {
  const b = base(t); const reg = (i, espacoId) => ({ id: 'o' + i, em: new Date(i).toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL', motivo: [], agentes: ['regressao'], dependencias: 'INDEPENDENTES', etapas: [], estado: 'CONCLUIDA', duracaoMs: 1 });
  const projeto = '11111111-1111-4111-8111-111111111111';
  for (let i = 0; i < 505; i++) registrarOrquestracao(reg(i, i % 2 ? projeto : null), b);
  fs.appendFileSync(arquivoDeOrquestracoes(b), 'linha quebrada\n');
  assert.equal(fs.readFileSync(arquivoDeOrquestracoes(b), 'utf8').split('\n').filter(Boolean).length, 501);
  const r = listarOrquestracoes(projeto, b);
  assert.equal(r.invalidas, 1); assert.equal(r.orquestracoes.length, 50); assert.equal(r.orquestracoes[0].id, 'o503');
  assert.ok(r.orquestracoes.every((o) => o.espacoId === projeto));
});
