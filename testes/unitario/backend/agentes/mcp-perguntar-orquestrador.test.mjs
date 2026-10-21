/** Ferramenta MCP perguntar_ao_orquestrador: leitura local pelo Orquestrador, com política, escopo do projeto e sem gravar a pergunta. Sem rede nem CLI real. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo mcp orquestrador '));
process.env.PRUMO_DATA_DIR = dados;
await import('../../../apoio/conhecimento-memoria.mjs');
const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
const { registrarPerguntarAoOrquestrador, respostaDaFerramentaMcp } = await import('../../../../dist/agentes/mcp/consultasDoProjeto.js');
const { exigirCapacidade, salvarConfiguracao } = await import('../../../../dist/agentes/servicoPoliticas.js');
const { idsEsp, capacidades } = await import('../../../../dist/agentes/tipos/persona.js');
const { criarEspaco } = await import('../../../../dist/projetos/servicoProjetos.js');
const { enfileirar, pegarProximoTrabalho, concluirTrabalho } = await import('../../../../dist/agendamentos/banco/fila.js');
const { criarProposta } = await import('../../../../dist/tickets/servicoPropostas.js');
const { criarRotina } = await import('../../../../dist/agendamentos/regras/cicloDaRotina.js');
test.after(() => fs.rmSync(dados, { recursive: true, force: true }));

const segredo = 'SEGREDOABC123456';
const espacoA = await criarEspaco({ nome: 'Projeto A', descricao: 'sintético' });
const espacoB = await criarEspaco({ nome: 'Projeto B', descricao: 'sintético' });

let n = 0;
function falha(espaco, capability, ticket) {
  const rotina = criarRotina({ nome: 'Smoke ' + n, espacoId: espaco.id, tipo: 'smoke', capability, ambiente: 'local', ticket, frequencia: { tipo: 'semanal', dias: [1], hora: '09:00' }, fuso: 'America/Sao_Paulo' });
  const { trabalho } = enfileirar({ chave: 'k' + n++, rotinaId: rotina.id, espacoId: espaco.id, tipo: 'smoke', capability, ambiente: 'local', ticket, origem: 'MANUAL', slot: null });
  pegarProximoTrabalho();
  concluirTrabalho(trabalho.id, { status: 'FAIL', motivo: 'falha', contagem: { pass: 0, fail: 1, blocked: 0, notRun: 0 }, detalhes: 'C1' });
}
falha(espacoA, 'cap-do-projeto-a', 'KAN-1');
criarProposta({ espacoId: espacoA.id, tipo: 'bug', origem: 'PESSOA', dados: { resumo: 'Vazamento token=' + segredo + ' no log' } });
falha(espacoB, 'cap-do-projeto-b', 'KAN-2');

/** Servidor MCP real do SDK com só esta ferramenta, ligada ao projeto informado e à política verdadeira. */
async function conectar(t, espaco) {
  const servidor = new McpServer({ name: 'prumo-teste', version: '0.0.0' });
  const meios = {
    servidor, cliente: () => 'teste', espaco: () => espaco, projeto: async () => ({}),
    resposta: fn => respostaDaFerramentaMcp(fn),
    guarda: (capacidade, fn) => respostaDaFerramentaMcp(async () => { exigirCapacidade(espaco?.id ?? null, capacidade); return fn(); })
  };
  registrarPerguntarAoOrquestrador(meios);
  const cliente = new Client({ name: 'teste', version: '0.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([servidor.connect(a), cliente.connect(b)]);
  t.after(() => cliente.close());
  const perguntar = async (argumentos) => {
    const r = await cliente.callTool({ name: 'perguntar_ao_orquestrador', arguments: argumentos });
    return { erro: r.isError === true, texto: r.content[0].text };
  };
  return { cliente, perguntar };
}

test('a capacidade é de leitura, permitida por padrão e editável só para BLOQUEADO', () => {
  const c = capacidades.find(x => x.id === 'perguntar_ao_orquestrador');
  assert.equal(c.ferramenta, 'perguntar_ao_orquestrador'); assert.equal(c.padrao, 'PERMITIDO'); assert.deepEqual(c.editavel, ['PERMITIDO', 'BLOQUEADO']);
});

test('pergunta local devolve linhas, fontes (telas) e o agente que respondeu, só leitura', async (t) => {
  const { cliente, perguntar } = await conectar(t, espacoA);
  const ferramenta = (await cliente.listTools()).tools.find(x => x.name === 'perguntar_ao_orquestrador');
  assert.equal(ferramenta.annotations.readOnlyHint, true); assert.equal(ferramenta.annotations.destructiveHint, false);
  const r = await perguntar({ pergunta: 'Qual o resultado das execuções?' });
  assert.equal(r.erro, false);
  const d = JSON.parse(r.texto);
  assert.equal(d.agente.id, 'regressao');
  assert.ok(d.linhas.length > 0 && d.linhas.some(l => /FAIL/.test(l)));
  assert.ok(d.fontes.some(f => f.aba === 'execucoes'));
  const forcado = JSON.parse((await perguntar({ pergunta: 'resumo', agente: 'monitoramento' })).texto);
  assert.equal(forcado.agente.id, 'monitoramento');
  assert.equal((await perguntar({ pergunta: 'resumo', agente: 'nao-existe' })).erro, true);
});

test('pergunta fora do tamanho ou com campo extra é recusada', async (t) => {
  const { perguntar } = await conectar(t, espacoA);
  for (const argumentos of [{ pergunta: 'x' }, { pergunta: ' x ' }, { pergunta: 'a'.repeat(301) }, { pergunta: 'quais execuções?', projeto: 'outro' }, {}]) assert.equal((await perguntar(argumentos)).erro, true);
  assert.equal((await perguntar({ pergunta: 'a'.repeat(300) })).erro, false);
});

test('sem projeto Prumo vinculado à raiz, recusa (NO_WORKSPACE) em vez de consultar tudo', async (t) => {
  const { perguntar } = await conectar(t, null);
  const r = await perguntar({ pergunta: 'o que falhou?' });
  assert.equal(r.erro, true); assert.match(r.texto, /NO_WORKSPACE/);
});

test('escopo: só dados do projeto do servidor, nunca de outro projeto', async (t) => {
  const a = await conectar(t, espacoA); const b = await conectar(t, espacoB);
  const deA = (await a.perguntar({ pergunta: 'O que falhou nas execuções?' })).texto;
  const deB = (await b.perguntar({ pergunta: 'O que falhou nas execuções?' })).texto;
  assert.match(deA, /cap-do-projeto-a/); assert.doesNotMatch(deA, /cap-do-projeto-b/);
  assert.match(deB, /cap-do-projeto-b/); assert.doesNotMatch(deB, /cap-do-projeto-a/);
});

test('segredo na resposta sai mascarado e a pergunta não é gravada em disco', async (t) => {
  const { perguntar } = await conectar(t, espacoA);
  const frase = 'MARCADOR-PERGUNTA-UNICA qual a situação da qualidade? senha=' + segredo.slice(0, 8);
  const r = await perguntar({ pergunta: frase });
  assert.equal(r.erro, false); assert.match(r.texto, /Vazamento/); assert.doesNotMatch(r.texto, new RegExp(segredo)); assert.match(r.texto, /REDACTED/);
  const arquivos = []; const percorrer = (p) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const c = path.join(p, e.name); e.isDirectory() ? percorrer(c) : arquivos.push(c); } };
  percorrer(dados);
  for (const a of arquivos) assert.ok(!fs.readFileSync(a).includes('MARCADOR-PERGUNTA-UNICA'), 'pergunta gravada em ' + a);
});

test('capacidade BLOQUEADA recusa com POLICY_BLOCKED e liberar de novo volta a responder', async (t) => {
  const { perguntar } = await conectar(t, espacoB);
  salvarConfiguracao(espacoB.id, { especializacoes: [...idsEsp], politicas: { perguntar_ao_orquestrador: 'BLOQUEADO' } }, 'teste');
  const bloqueada = await perguntar({ pergunta: 'O que falhou nas execuções?' });
  assert.equal(bloqueada.erro, true); assert.match(bloqueada.texto, /POLICY_BLOCKED/); assert.doesNotMatch(bloqueada.texto, /cap-do-projeto/);
  salvarConfiguracao(espacoB.id, { especializacoes: [...idsEsp], politicas: {} }, 'teste');
  assert.equal((await perguntar({ pergunta: 'O que falhou nas execuções?' })).erro, false);
});
