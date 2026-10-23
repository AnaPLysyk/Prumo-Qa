/** Regressões MCP com projeto e diário sintéticos; nenhum CLI real ou serviço externo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fixture } from '../../utilitarios/fixtures.mjs';
import '../../utilitarios/conhecimento-memoria.mjs';
const { conversar } = await import('../../../../dist/agentes/chat/conversar.js');
const { consultarIaExterna } = await import('../../../../dist/agentes/chat/consultarIaExterna.js');
const { criarEspaco, vincularPastaAoEspaco } = await import('../../../../dist/projetos/servicoProjetos.js');
const { carregarProjeto } = await import('../../../../dist/compartilhado/projeto/carregarProjeto.js');
const { iniciarAtividade } = await import('../../../../dist/logs/regras/iniciarAtividade.js');
const { transporteObservado } = await import('../../../../dist/agentes/mcp/criarServidor.js');
const agente = { id: 'orquestrador', nome: 'Prumo', especializacao: null, dominio: 'Chat', palavras: [], aba: 'inicio', rotulo: 'Início' };
const resposta = { codigo: 0, saida: 'Resposta externa sintética.', erro: '' };
const opcoes = { espacoId: null, pergunta: 'o que é teste de regressão?', autorizados: { claude: true }, executavel: () => '/falso/claude', executor: async () => resposta };

test('conversar preserva os estados sem projeto e pergunta geral para o cabeçalho', async () => {
  const geral = await conversar({ ...opcoes, provedor: 'local' });
  assert.deepEqual(geral.mcp, { estado: 'NAO_NECESSARIO', ferramentas: [] });
  const explicita = await conversar({ ...opcoes, provedor: 'claude' });
  assert.deepEqual(explicita.mcp, { estado: 'SEM_PROJETO', ferramentas: [] });
});

async function consultar(t, executar, base) {
  const f = await fixture(t);
  const espaco = await criarEspaco({ nome: 'Sintético', descricao: '' }, base);
  await vincularPastaAoEspaco(espaco.id, f.root, base);
  const projeto = await carregarProjeto(f.root);
  const o = { ...opcoes, base, espacoId: espaco.id, executor: async (_exe, args, opts) => {
    const config = JSON.parse(args[args.indexOf('--mcp-config') + 1]).mcpServers.prumo;
    await executar(projeto, config.env, opts);
    return resposta;
  }};
  return consultarIaExterna({ o, agente, pergunta: o.pergunta, local: { linhas: [], fontes: [], fatos: [] }, estilo: 'direto', nome: 'Prumo', perfil: null, historico: [], comum: {}, provedor: 'claude', montar: (_a, _c, _m, extra) => extra, vestido: () => [] });
}

test('MCP de outra consulta e registros legados não confirmam a resposta', async t => {
  const r = await consultar(t, projeto => {
    iniciarAtividade(projeto, 'listar_politicas', { origin: 'MCP', client: 'claude' }).finalizar({});
    iniciarAtividade(projeto, 'contexto_projeto', { origin: 'MCP', client: 'claude', consultaId: randomUUID() }).finalizar({});
  });
  assert.deepEqual(r.mcp, { estado: 'NAO_CONFIRMADO', ferramentas: [] });
});

test('somente chamada concluída desta consulta e base confirma; transporte persiste correlação', async t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo evidencia base '));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const r = await consultar(t, async (projeto, env) => {
    assert.match(env.PRUMO_MCP_CONSULTA_ID ?? '', /^[0-9a-f-]{36}$/);
    assert.equal(env.PRUMO_MCP_CONSULTA_BASE, base);
    iniciarAtividade(projeto, 'contexto_projeto', { origin: 'MCP', consultaId: env.PRUMO_MCP_CONSULTA_ID }, {}, { base }).finalizar({}, true);
    iniciarAtividade(projeto, 'revisar_cobertura', { origin: 'MCP', consultaId: env.PRUMO_MCP_CONSULTA_ID }, {}, { base });
    iniciarAtividade(projeto, 'consultar_evidencias', { origin: 'MCP', consultaId: env.PRUMO_MCP_CONSULTA_ID }).finalizar({});
    const transporte = { start: async () => {}, send: async () => {}, close: async () => {} };
    const observado = transporteObservado(transporte, projeto, () => 'claude', { consultaId: env.PRUMO_MCP_CONSULTA_ID, base });
    await observado.start();
    transporte.onmessage({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'listar_politicas', arguments: {} } });
    await observado.send({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '{}' }] } });
  }, base);
  assert.deepEqual(r.mcp, { estado: 'CONFIRMADO', ferramentas: ['listar_politicas'] });
});

test('a correlação chega à configuração MCP dos quatro provedores sem ampliar ferramentas', async () => {
  const { consultarCliDaIa } = await import('../../../../dist/agentes/chat/consultarIaExterna.js');
  const id = randomUUID();
  for (const provedor of ['claude', 'codex', 'copilot', 'gemini']) {
    let config;
    const r = await consultarCliDaIa({ executor: async (_exe, args, opts) => {
      if (provedor === 'gemini') config = opts.mcpGemini;
      else if (provedor === 'codex') {
        assert.ok(args.some(v => v.includes(`PRUMO_MCP_CONSULTA_ID="${id}"`)));
        return resposta;
      } else config = JSON.parse(args[args.indexOf(provedor === 'claude' ? '--mcp-config' : '--additional-mcp-config') + 1]).mcpServers.prumo;
      assert.equal(config.env.PRUMO_MCP_CONSULTA_ID, id);
      return resposta;
    } }, provedor, '/falso', 'pergunta', os.tmpdir(), 1000, false, { id });
    assert.equal(r.ok, true, provedor);
  }
});
