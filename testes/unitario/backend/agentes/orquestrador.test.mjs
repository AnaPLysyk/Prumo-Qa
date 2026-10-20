import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Lista de QA do chat orquestrado: cada agente, estilos, funcionamento sem integrações, delegação opcional
// (sempre com executor falso: nenhum CLI real, rede ou projeto externo) e conversas gravadas só localmente.
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo orquestrador '));
process.env.PRUMO_DATA_DIR = dados;
await import('../../infra/conhecimento-memoria.mjs');
const { conversar } = await import('../../../../dist/agentes/chat/conversar.js'); const { escolherAgente: rotear } = await import('../../../../dist/agentes/chat/escolherAgente.js'); const { agentesChat } = await import('../../../../dist/agentes/tipos/persona.js'); const { aplicarEstilo } = await import('../../../../dist/agentes/chat/aplicarEstilo.js'); const { montarPrompt } = await import('../../../../dist/agentes/chat/montarPrompt.js'); const { argumentosDoProvedorDeIa: argumentosProvedor } = await import('../../../../dist/agentes/chat/argumentosDoProvedorDeIa.js'); const { agentesDoChat: rosterDoChat } = await import('../../../../dist/agentes/chat/agentesDoChat.js');
const { criarEspaco } = await import('../../../../dist/projetos/regras/criarEspaco.js');
const { criarRotina } = await import('../../../../dist/agendamentos/regras/criarRotina.js');
const { enfileirar } = await import('../../../../dist/agendamentos/banco/enfileirar.js'); const { pegarProximoTrabalho: reivindicar } = await import('../../../../dist/agendamentos/banco/pegarProximoTrabalho.js'); const { concluirTrabalho: concluir } = await import('../../../../dist/agendamentos/banco/concluirTrabalho.js');
const { lerPreferencias } = await import('../../../../dist/configuracoes/banco/lerPreferencias.js'); const { alterarPreferencias } = await import('../../../../dist/configuracoes/regras/alterarPreferencias.js'); const { autorizarDelegacaoDeIa: autorizarDelegacao } = await import('../../../../dist/agentes/regras/autorizarDelegacaoDeIa.js');
const { falhasConhecimento } = await import('../../infra/conhecimento-falso.mjs');
test.after(() => fs.rmSync(dados, { recursive: true, force: true }));

const espaco = await criarEspaco({ nome: 'Orquestra', descricao: 'sintético' }, dados);
const rotina = criarRotina({ nome: 'Smoke', espacoId: espaco.id, tipo: 'smoke', capability: 'unit', ambiente: 'local', ticket: 'ORQ-1', frequencia: { tipo: 'semanal', dias: [1], hora: '09:00' }, fuso: 'America/Sao_Paulo' }, dados);
for (const [i, res] of [{ status: 'PASS', motivo: 'ok', contagem: { pass: 1, fail: 0, blocked: 0, notRun: 0 } }, { status: 'FAIL', motivo: 'falha', contagem: { pass: 0, fail: 1, blocked: 0, notRun: 0 }, detalhes: 'C1' }].entries()) {
  const { trabalho } = enfileirar({ chave: 'o' + i, rotinaId: rotina.id, espacoId: espaco.id, tipo: 'smoke', capability: 'unit', ambiente: 'local', ticket: 'ORQ-1', origem: 'MANUAL', slot: null }, dados); reivindicar(dados); concluir(trabalho.id, res, dados);
}

const casos = [
  ['Olá, o que você faz?', 'orquestrador'], ['Como faço para mudar o tema?', 'orquestrador'], ['Como conectar o Codex?', 'orquestrador'],
  ['Qual a situação geral da qualidade?', 'qa-geral'], ['Tem alguma proposta de caso de teste?', 'qa-geral'],
  ['Quais requisitos e critérios de aceite temos?', 'requisitos'], ['Existe lacuna de rastreabilidade?', 'requisitos'],
  ['Temos testes playwright de navegador?', 'playwright'], ['Quais testes de API e endpoint existem?', 'api-rest'], ['Como está a acessibilidade e o contraste?', 'acessibilidade'],
  ['O que falhou e qual o erro?', 'investigacao-bugs'], ['O que falhou nas execuções?', 'investigacao-bugs'], ['Teve erro na regressão de ontem?', 'investigacao-bugs'], ['Investigar o bug nos logs', 'investigacao-bugs'],
  ['Quando roda a próxima rotina de regressão?', 'regressao'], ['Qual o resultado das execuções?', 'regressao'],
  ['O que mudou no histórico recente?', 'monitoramento']
];
for (const [pergunta, esperado] of casos) test(`roteia "${pergunta}" para ${esperado}`, () => assert.equal(rotear(pergunta).agente.id, esperado));

test('menção explícita ao agente decide; pergunta sem sinal vai ao orquestrador', () => {
  assert.equal(rotear('@regressao me ajuda com falhas').agente.id, 'regressao');
  assert.equal(rotear('falhas', 'monitoramento').agente.id, 'monitoramento');
  assert.equal(rotear('xyz qwerty').agente.id, 'orquestrador');
  assert.ok(agentesChat.filter((a) => a.especializacao).length >= 8, 'um agente de chat por especialização do núcleo');
});

test('sem projeto e sem integrações todos os agentes respondem sem erro e sem inventar', async () => {
  for (const a of agentesChat) {
    const r = await conversar({ espacoId: null, pergunta: 'Pergunta de teste ' + a.nome, agente: a.id, base: dados });
    assert.equal(r.modo, 'LOCAL'); assert.equal(r.agente.id, a.id); assert.ok(r.linhas.length > 0 && r.linhas.every((l) => typeof l === 'string' && l.length > 0));
    assert.doesNotMatch(r.linhas.join(' '), /undefined|null|NaN|\[object/);
  }
});

test('regressão e investigação usam as execuções reais do projeto (PASS e FAIL)', async () => {
  const reg = await conversar({ espacoId: espaco.id, pergunta: 'resultado das execuções', base: dados, estilo: 'direto' });
  assert.equal(reg.agente.id, 'regressao'); assert.match(reg.linhas.join(' '), /2 execuç(ão|ões)\(ões\)? registrada|2 execução\(ões\) registrada\(s\): 1 PASS, 1 FAIL/);
  assert.ok(reg.fontes.some((f) => f.aba === 'execucoes'));
  const bug = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', base: dados });
  assert.equal(bug.agente.id, 'investigacao-bugs'); assert.match(bug.linhas.join(' '), /Últimas falhas: unit \(ORQ-1\)/);
});

test('estilos mudam a forma, nunca os fatos', () => {
  const a = agentesChat.find((x) => x.id === 'regressao'); const fatos = ['execucoes=2'];
  const linhas = ['2 execuções.', 'Última: PASS.', 'Próxima: amanhã.', 'Rotinas: 1.'];
  assert.deepEqual(aplicarEstilo(linhas, 'direto', 'Aurora', a, true, fatos), linhas.slice(0, 3));
  const amigavel = aplicarEstilo(linhas, 'amigavel', 'Aurora', a, true, fatos); assert.match(amigavel[0], /Regressão aqui/); assert.ok(linhas.every((l) => amigavel.includes(l)));
  assert.match(aplicarEstilo(linhas, 'amigavel', 'Aurora', agentesChat[0], true, [])[0], /Aurora/, 'nome escolhido para o assistente');
  assert.match(aplicarEstilo(linhas, 'tecnico', 'Aurora', a, false, fatos).at(-1), /regressao · skills\/regressao · execucoes=2/);
});

test('IA externa: sem autorização, sem executável ou com falha, a resposta volta para local e avisa', async () => {
  let chamado = 0; const executor = async () => { chamado++; return { codigo: 0, saida: 'nunca', erro: '' }; };
  let r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'claude', executor, executavel: () => 'claude.exe', autorizados: { claude: false }, base: dados });
  assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /não autorizada/); assert.equal(chamado, 0);
  r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'codex', executor, executavel: () => null, autorizados: { codex: true }, base: dados });
  assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /não encontrado/); assert.equal(chamado, 0);
  r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'claude', executor: async () => ({ codigo: 1, saida: '', erro: 'x' }), executavel: () => 'claude.exe', autorizados: { claude: true }, base: dados });
  assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /não respondeu/);
  r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'claude', executor: async () => { throw new Error('spawn'); }, executavel: () => 'claude.exe', autorizados: { claude: true }, base: dados });
  assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /Falha ao chamar/);
});

test('IA externa autorizada: CLI sem shell recebe skill, fatos locais e pergunta; resposta identifica o provedor', async () => {
  let visto;
  const executor = async (comando, args, o) => { visto = { comando, args, o }; return { codigo: 0, saida: 'A falha foi em unit (ORQ-1).\n\nSugiro rever C1.', erro: '' }; };
  const r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'claude', executor, executavel: () => 'C:/fake/claude.exe', autorizados: { claude: true }, base: dados });
  assert.equal(r.modo, 'CLAUDE'); assert.equal(r.agente.id, 'investigacao-bugs'); assert.deepEqual(r.linhas, ['A falha foi em unit (ORQ-1).', 'Sugiro rever C1.']);
  assert.equal(visto.comando, 'C:/fake/claude.exe'); assert.equal(visto.args[0], '-p'); assert.ok(visto.o.timeoutMs <= 120000);
  assert.match(visto.args.at(-1), /Investigação de Bugs/); assert.match(visto.args.at(-1), /Últimas falhas: unit \(ORQ-1\)/); assert.match(visto.args.at(-1), /Não invente/); assert.match(visto.args.at(-1), /o que falhou\?/);
  assert.deepEqual(argumentosProvedor('codex', 'p').slice(0, 2), ['exec', '--skip-git-repo-check']);
  const codex = argumentosProvedor('codex', '--dangerously-bypass-approvals-and-sandbox');
  assert.equal(codex[codex.indexOf('--sandbox') + 1], 'read-only');
  assert.ok(codex.includes('approval_policy="never"') && codex.includes('--ephemeral'));
  assert.ok(codex.includes('--ignore-user-config'));
  for (const feature of ['hooks', 'apps', 'plugins', 'remote_plugin', 'shell_tool', 'unified_exec']) assert.ok(codex.some((arg, i) => arg === '--disable' && codex[i + 1] === feature));
  assert.equal(codex.at(-2), '--', 'pergunta nunca é opção do CLI');
  const claude = argumentosProvedor('claude', 'p');
  assert.equal(claude[claude.indexOf('--tools') + 1], '');
  assert.ok(claude.includes('--strict-mcp-config') && claude.includes('--no-session-persistence'));
  assert.match(montarPrompt(agentesChat.find((a) => a.id === 'playwright'), 'q', { linhas: ['f'], fontes: [], fatos: [] }, 'tecnico', 'Aurora'), /--- Skill [^\n]*---[\s\S]*playwright/i);
});

test('preferências do assistente: nome, estilo e voz pela interface; delegação só pela autorização dedicada', () => {
  assert.deepEqual(lerPreferencias(dados).ia, { nome: 'Prumo', estilo: 'amigavel', voz: null, lerRespostas: false, delegacao: { claude: false, codex: false } });
  alterarPreferencias({ ia: { nome: 'Aurora', estilo: 'tecnico', voz: 'Microsoft Maria', lerRespostas: true } }, dados);
  assert.throws(() => alterarPreferencias({ ia: { delegacao: { claude: true } } }, dados), /Unrecognized|unrecognized/);
  assert.throws(() => alterarPreferencias({ ia: { nome: '<script>' } }, dados));
  assert.equal(lerPreferencias(dados).ia.delegacao.claude, false);
  autorizarDelegacao('claude', true, dados); alterarPreferencias({ tema: 'escuro' }, dados);
  const ia = lerPreferencias(dados).ia; assert.equal(ia.nome, 'Aurora'); assert.equal(ia.estilo, 'tecnico'); assert.equal(ia.delegacao.claude, true, 'alterar outra preferência preserva a autorização');
});

test('falha de armazenamento do aprendizado preserva a resposta externa e avisa sem inventar aprovação', async () => {
  falhasConhecimento.registrar = 'KNOWLEDGE_RATE_LIMIT';
  try {
    const r = await conversar({ espacoId: espaco.id, pergunta: 'o que falhou?', provedor: 'claude', executavel: () => 'fake.exe', autorizados: { claude: true }, base: dados, executor: async () => ({ codigo: 0, saida: 'Resposta com fonte.\nAPRENDIZADO: O projeto usa testes sintéticos.', erro: '' }) });
    assert.equal(r.modo, 'CLAUDE'); assert.deepEqual(r.linhas, ['Resposta com fonte.']); assert.deepEqual(r.acoes, []); assert.match(r.aviso, /1 aprendizado.*não foram registrados/);
  } finally { falhasConhecimento.registrar = null; }
});

test('roster liga cada agente do chat à especialização e ao estado das capacidades do projeto', () => {
  const r = rosterDoChat(espaco.id, dados); const qa = r.find((a) => a.id === 'qa-geral');
  assert.equal(qa.skill, 'backend/agentes/skills/qa'); assert.ok(qa.capacidades.length > 0 && qa.capacidades.every((c) => c.estado));
  assert.equal(r.find((a) => a.id === 'orquestrador').skill, null);
});

test('skills adaptadas de fontes abertas: referência ligada no SKILL.md, crédito e licença registrados', () => {
  const terceiros = fs.readFileSync('backend/agentes/skills/TERCEIROS.md', 'utf8');
  for (const [skill, ref] of [['investigacao-bugs', 'praticas-abertas.md'], ['acessibilidade', 'praticas-abertas.md'], ['regressao', 'praticas-abertas.md'], ['api-rest', 'praticas-abertas.md'], ['playwright', 'praticas-abertas.md'], ['qa', 'estrategia.md']]) {
    const texto = fs.readFileSync(`backend/agentes/skills/${skill}/references/${ref}`, 'utf8');
    assert.match(texto, /TERCEIROS\.md/, `${skill}: aponta os créditos`); assert.match(fs.readFileSync(`backend/agentes/skills/${skill}/SKILL.md`, 'utf8'), new RegExp(`references/${ref}`), `${skill}: SKILL.md liga a referência`);
    assert.match(terceiros, new RegExp(skill), `${skill}: aparece nos créditos`);
  }
  assert.match(terceiros, /Copyright \(c\) 2026 TestDino/); assert.match(terceiros, /Copyright \(c\) 2026 Douglas Urrea Ocampo/); assert.match(terceiros, /Copyright 2026 Anthropic, PBC/);
  assert.match(fs.readFileSync('backend/agentes/skills/licencas/APACHE-2.0.txt', 'utf8'), /Apache License[\s\S]*Version 2\.0/);
});

