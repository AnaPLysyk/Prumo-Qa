// Mapa de vínculos: os agentes sabem exatamente onde cada projeto do Prumo está ligado (Jira, Qase, GitHub, pasta local, Manual)
// e o que podem fazer em cada ligação, no chat, na IA externa e no MCP. Tudo com dados sintéticos e perfil temporário.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo vinculos '));
process.env.PRUMO_DATA_DIR = dados;
await import('../../utilitarios/conhecimento-memoria.mjs');
const { mapaDeVinculosDoProjeto, linhasDoMapaDeVinculos } = await import('../../../../dist/agentes/regras/vinculosDoProjeto.js');
const { responderComDadosLocais } = await import('../../../../dist/agentes/chat/responderComDadosLocais.js');
const { montarPrompt } = await import('../../../../dist/agentes/chat/consultarIaExterna.js');
const { vinculosParaMcp } = await import('../../../../dist/agentes/mcp/consultasDoProjeto.js');
const { agentesChat } = await import('../../../../dist/agentes/tipos/persona.js');
const { criarEspaco, vincularServicoAoEspaco, alternarVinculoServico } = await import('../../../../dist/projetos/servicoProjetos.js');
const { habilitarEscrita } = await import('../../../../dist/conexoes/escrita/permissoes.js');
const { atualizarEspaco } = await import('../../../../dist/projetos/banco/projetos.js');
const { vinculoSchema } = await import('../../../../dist/projetos/contratos.js');
test.after(() => fs.rmSync(dados, { recursive: true, force: true }));

const CONEXAO = '00000000-0000-4000-8000-000000000001';
const jira = { id: '10000', chave: 'KAN', nome: 'Qa', instancia: 'https://paulalysyk1234.atlassian.net', contaId: 'conta-jira', tipoId: 'id_api' };
const qase = { id: 'PQ', chave: 'PQ', nome: 'Prumo QA', instancia: 'https://api.qase.io', contaId: 'conexao-local:1', tipoId: 'codigo_api' };
const orquestrador = agentesChat.find((a) => a.id === 'orquestrador');

const espaco = await criarEspaco({ nome: 'Plataforma', descricao: '' }, dados, { servico: 'jira', conexaoId: CONEXAO, recurso: jira });
await vincularServicoAoEspaco(espaco.id, 'qase', CONEXAO, qase, dados);
habilitarEscrita(espaco.id, 'jira', true, 'teste', dados);
alternarVinculoServico(espaco.id, 'qase', false, dados);

test('o mapa diz onde o projeto está ligado, o que está ativo e o que cada ligação permite', () => {
  const mapa = mapaDeVinculosDoProjeto(espaco.id, dados);
  assert.deepEqual(mapa.projeto, { id: espaco.id, nome: 'Plataforma' });
  const j = mapa.vinculos.find((v) => v.servico === 'jira');
  assert.deepEqual({ chave: j.chave, nome: j.nome, endereco: j.endereco, escrita: j.escrita }, { chave: 'KAN', nome: 'Qa', endereco: 'paulalysyk1234.atlassian.net', escrita: true });
  assert.ok(j.escritas.length > 0, 'com a escrita habilitada, as operações permitidas do Jira são listadas');
  assert.ok(j.leitura.includes('tickets'));
  const q = mapa.vinculos.find((v) => v.servico === 'qase');
  assert.equal(q.situacao, 'DESLIGADO');
  assert.deepEqual(q.escritas, [], 'sem escrita habilitada, nenhuma operação de escrita é listada');
  assert.deepEqual(mapa.semVinculo, ['github']);
  assert.deepEqual(mapa.pastaLocal, { vinculada: false, nome: null });
  assert.equal(mapa.manual.ativo, true);
});

test('o mapa nunca carrega segredo, endereço de API nem caminho completo da pasta', () => {
  const texto = JSON.stringify(mapaDeVinculosDoProjeto(espaco.id, dados)) + linhasDoMapaDeVinculos(mapaDeVinculosDoProjeto(espaco.id, dados)).join('\n');
  for (const proibido of ['token', 'senha', 'password', 'api.qase.io', 'api.github.com', 'conexao-local', CONEXAO, dados]) assert.ok(!texto.includes(proibido), proibido);
});

test('as frases deixam claro o destino único, o que está desligado, o que falta vincular e o Manual', () => {
  const linhas = linhasDoMapaDeVinculos(mapaDeVinculosDoProjeto(espaco.id, dados));
  const texto = linhas.join('\n');
  assert.match(texto, /Projeto "Plataforma": cada ferramenta abaixo é o único destino deste projeto/);
  assert.match(texto, /Jira: projeto KAN \(Qa\) em paulalysyk1234\.atlassian\.net · ativo · lê tickets, campos, comentários, transições, histórico · pode propor, com confirmação da pessoa:/);
  assert.match(texto, /Qase: projeto PQ \(Prumo QA\) em app\.qase\.io\/project\/PQ · DESLIGADO: não consulte nem envie nada/);
  assert.match(texto, /Sem vínculo neste projeto: GitHub\. Não invente destino/);
  assert.match(texto, /Pasta local: não vinculada\./);
  assert.match(texto, /Manual\/Prumo: ativo/);
});

test('sem escrita habilitada o agente é avisado de que só pode ler', () => {
  habilitarEscrita(espaco.id, 'jira', false, 'teste', dados);
  try {
    const texto = linhasDoMapaDeVinculos(mapaDeVinculosDoProjeto(espaco.id, dados)).join('\n');
    assert.match(texto, /Jira: .* ativo · lê .* · só leitura \(a escrita está desligada neste projeto\)/);
  } finally { habilitarEscrita(espaco.id, 'jira', true, 'teste', dados); }
});

test('vínculo com verificação falha manda o agente avisar a pessoa em vez de agir', () => {
  const mapa = mapaDeVinculosDoProjeto(espaco.id, dados);
  const sem = { ...mapa, vinculos: mapa.vinculos.map((v) => (v.servico === 'jira' ? { ...v, situacao: 'PRECISA_REVISAO', estado: 'SEM_CREDENCIAL' } : v)) };
  assert.match(linhasDoMapaDeVinculos(sem).join('\n'), /Jira: .* precisa de verificação \(estado SEM_CREDENCIAL\): avise a pessoa em vez de agir\./);
});

test('Orchestrator responde "onde este projeto está ligado?" pelo mapa do projeto escolhido', async () => {
  for (const pergunta of ['Onde este projeto está vinculado?', 'Quais são os vínculos do projeto?', 'Em quais ferramentas ele está ligado?', 'Onde fica o repositório?']) {
    const r = await responderComDadosLocais(orquestrador, pergunta, espaco.id, dados);
    assert.match(r.linhas.join('\n'), /Jira: projeto KAN \(Qa\) em paulalysyk1234\.atlassian\.net/, pergunta);
    assert.ok(r.fatos.includes('vinculos=2'), pergunta);
    assert.ok(r.fontes.some((f) => f.aba === 'projetos'));
  }
});

test('sem projeto escolhido o Orchestrator não revela vínculo de outro projeto', async () => {
  const r = await responderComDadosLocais(orquestrador, 'Onde este projeto está vinculado?', null, dados);
  assert.deepEqual(r.linhas, ['Selecione um projeto para eu consultar os dados dele.']);
});

test('perguntas que já tinham resposta do guia continuam com a mesma resposta', async () => {
  const r = await responderComDadosLocais(orquestrador, 'Como conectar o Codex?', espaco.id, dados);
  assert.ok(!r.linhas.join('\n').includes('cada ferramenta abaixo é o único destino'));
});

test('a IA externa recebe os vínculos exatos do projeto antes dos fatos locais; sem vínculos, a seção não existe', () => {
  const linhas = linhasDoMapaDeVinculos(mapaDeVinculosDoProjeto(espaco.id, dados));
  const local = { linhas: ['fato local'], fontes: [], fatos: [], generico: false };
  const com = montarPrompt(orquestrador, 'comente no KAN-3', local, 'equilibrado', 'Prumo', { vinculos: linhas, skill: '' });
  assert.match(com, /--- Vínculos deste projeto \(use exatamente estes destinos/);
  assert.ok(com.indexOf('Vínculos deste projeto') < com.indexOf('Fatos locais do Prumo'));
  assert.match(com, /Jira: projeto KAN \(Qa\)/);
  const sem = montarPrompt(orquestrador, 'oi', local, 'equilibrado', 'Prumo', { skill: '' });
  assert.ok(!sem.includes('Vínculos deste projeto'));
});

test('MCP contexto_projeto devolve o mapa do projeto Prumo da raiz; fora de um projeto diz que não há vínculos', () => {
  const r = vinculosParaMcp(espaco.raizContextos, dados);
  assert.equal(r.disponivel, true);
  assert.equal(r.mapa.vinculos.length, 2);
  assert.match(r.resumo.join('\n'), /Qase: projeto PQ/);
  const fora = vinculosParaMcp(path.join(dados, 'pasta-sem-projeto'), dados);
  assert.equal(fora.disponivel, false);
  assert.match(fora.motivo, /não está ligada a um projeto do Prumo/);
});

test('vínculo repetido em outro projeto (de antes da regra de um só projeto) vira aviso para o agente não agir às cegas', async () => {
  const outro = await criarEspaco({ nome: 'Duplicado antigo', descricao: '' }, dados);
  atualizarEspaco(outro.id, (e) => { e.vinculos.push(vinculoSchema.parse({ id: '22222222-2222-4222-8222-222222222222', servico: 'jira', conexaoId: CONEXAO, recurso: jira, validadoEm: new Date().toISOString(), estado: 'VALIDO' })); }, dados);
  const mapa = mapaDeVinculosDoProjeto(espaco.id, dados);
  assert.deepEqual(mapa.duplicidades, [{ onde: 'jira', projeto: 'Duplicado antigo' }]);
  assert.match(linhasDoMapaDeVinculos(mapa).join(' '), /ATENÇÃO: o mesmo projeto Jira também está no projeto "Duplicado antigo" do Prumo\. Não aja neste destino até a pessoa resolver em Projetos\./);
  const limpo = mapaDeVinculosDoProjeto(outro.id, dados);
  assert.deepEqual(limpo.duplicidades, [{ onde: 'jira', projeto: 'Plataforma' }], 'o aviso vale para os dois lados');
});
