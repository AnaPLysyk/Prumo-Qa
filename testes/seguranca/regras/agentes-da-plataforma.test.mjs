// Configuração geral dos agentes (Administração › Agentes): agente desligado sai do roteamento do chat e das políticas do MCP.
// Pasta de dados temporária por teste; nenhum SQLite nem serviço externo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { agentesDaPlataformaParaJanela, especializacaoLigada, regrasDosAgentes, salvarAgentesDaPlataforma } from '../../../dist/administracao/regras/agentesDaPlataforma.js';
import { escolherAgente } from '../../../dist/agentes/chat/escolherAgente.js';
import { agentesDoChat } from '../../../dist/agentes/chat/agentesDoChat.js';
import { configuracaoDoEspaco } from '../../../dist/agentes/politicas/configuracaoDoEspaco.js';

const pasta = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-agentes-plataforma-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };
const espaco = '11111111-1111-4111-8111-111111111111';

test('padrão: todos os agentes ligados, IA externa e orquestração permitidas', (t) => {
  const b = pasta(t); const c = regrasDosAgentes(b);
  assert.deepEqual([c.desligados, c.iaExterna, c.orquestracao], [[], true, true]);
  assert.ok(agentesDaPlataformaParaJanela(b).agentes.every((a) => a.ligado));
  assert.equal(configuracaoDoEspaco(espaco, b).especializacoes.length, 8);
});

test('agente desligado: some das políticas do projeto (MCP), da lista do chat e do roteamento, mesmo citado pelo nome', (t) => {
  const b = pasta(t);
  assert.equal(escolherAgente('@playwright o teste de login falhou na tela').agente.id, 'playwright');
  salvarAgentesDaPlataforma({ desligados: ['playwright'], iaExterna: false, orquestracao: false }, b);
  assert.equal(especializacaoLigada('playwright', b), false);
  assert.ok(!configuracaoDoEspaco(espaco, b).especializacoes.includes('playwright'));
  assert.ok(!agentesDoChat(null, b).some((a) => a.id === 'playwright'));
  const r = escolherAgente('@playwright o teste de login falhou na tela', 'playwright', { desligados: regrasDosAgentes(b).desligados });
  assert.notEqual(r.agente.id, 'playwright'); assert.ok(!r.rota.some((x) => x.agente === 'playwright'));
  const c = regrasDosAgentes(b); assert.equal(c.iaExterna, false); assert.equal(c.orquestracao, false); assert.ok(c.alteradoEm);
});

test('o Orchestrator não pode ser desligado e agente desconhecido é recusado', (t) => {
  const b = pasta(t);
  assert.throws(() => salvarAgentesDaPlataforma({ desligados: ['orquestrador'], iaExterna: true, orquestracao: true }, b), /^Error: AGENT_UNKNOWN/);
  assert.throws(() => salvarAgentesDaPlataforma({ desligados: ['robo-inventado'], iaExterna: true, orquestracao: true }, b), /^Error: AGENT_UNKNOWN/);
  assert.equal(fs.existsSync(path.join(b, 'plataforma', 'agentes-plataforma.json')), false, 'recusa não grava nada');
});

test('arquivo ilegível não derruba o chat nem o MCP: vale o padrão', (t) => {
  const b = pasta(t); fs.mkdirSync(path.join(b, 'plataforma'), { recursive: true });
  fs.writeFileSync(path.join(b, 'plataforma', 'agentes-plataforma.json'), '{quebrado');
  assert.equal(regrasDosAgentes(b).iaExterna, true); assert.equal(configuracaoDoEspaco(espaco, b).especializacoes.length, 8);
  assert.throws(() => agentesDaPlataformaParaJanela(b), /LOCAL_DATA_INVALID/, 'a Administração mostra o problema em vez de esconder');
});
