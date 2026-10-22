import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-qa-conhecimento-'));
process.env.PRUMO_DATA_DIR = base;
const { responderComFundamentosDeQa } = await import('../../../../dist/agentes/chat/responderComFundamentosDeQa.js');
const { conversar, perguntaDeConhecimento } = await import('../../../../dist/agentes/chat/conversar.js');
const { argumentosDoProvedorDeIa, montarPromptGeral, separarSugestoes } = await import('../../../../dist/agentes/chat/consultarIaExterna.js');

const PERGUNTAS = [
  ['o que é teste de regressão?', 'regress'], ['qual a diferença entre severidade e prioridade?', 'Severidade'], ['como escrever um bom caso de teste?', 'caso de teste'],
  ['como reportar um bug direito?', 'bug'], ['explique a pirâmide de testes', 'Pirâmide'], ['o que é valor limite?', 'limite'], ['o que é partição de equivalência?', 'equivalência'],
  ['o que é BDD e gherkin?', 'BDD'], ['o que é TDD?', 'TDD'], ['como testar uma API REST?', 'API'], ['como fazer teste de performance com k6?', 'performance'],
  ['o que é OWASP e xss?', 'OWASP'], ['como testar acessibilidade WCAG?', 'WCAG'], ['o que são testes flaky?', 'flaky'], ['qual a diferença entre smoke e sanity?', 'Smoke'],
  ['o que é teste exploratório?', 'exploratório'], ['o que é shift-left?', 'Shift-left'], ['qual a diferença entre Playwright e Cypress?', 'Playwright'], ['o que é um quality gate no CI/CD?', 'quality gates'],
  ['o que é verificação e validação?', 'Verificação'], ['o que é um oráculo de teste?', 'Oráculo'], ['como medir a qualidade com métricas?', 'Métricas'], ['o que é teste de contrato com pact?', 'contrato'],
  ['o que é LGPD em testes?', 'LGPD'], ['qual a diferença entre mock e stub?', 'Mocks']
];

test('a base offline responde as 25 perguntas básicas de QA com o assunto certo', () => {
  for (const [pergunta, esperado] of PERGUNTAS) {
    const r = responderComFundamentosDeQa(pergunta);
    assert.ok(r, 'sem resposta: ' + pergunta);
    assert.match(r.join(' '), new RegExp(esperado, 'i'), pergunta);
  }
});

test('a base offline não inventa resposta para o que não conhece', () => {
  assert.equal(responderComFundamentosDeQa('qual a capital da Austrália?'), null);
  assert.equal(responderComFundamentosDeQa('sapiens da rapidez capital'), null);
});

test('pergunta de conhecimento vai para a IA; dado do projeto e ajuda do sistema ficam locais', () => {
  for (const p of ['o que é teste de regressão?', 'qual é a versão mais recente do Playwright hoje?', 'como testar um formulário de login?', 'por que meu teste e2e é lento em geral?', 'me dá um exemplo de caso de teste para um login', 'escreva um cenário gherkin de checkout', 'explique docker para quem testa'])
    assert.equal(perguntaDeConhecimento(p), true, p);
  for (const p of ['como estão meus testes?', 'quantos testes falharam na última execução?', 'como faço para vincular um projeto no Prumo?', 'oi', 'status do projeto', 'o que o orquestrador sabe?'])
    assert.equal(perguntaDeConhecimento(p), false, p);
});

test('sem nenhuma IA disponível, o chat responde pela base offline e avisa; sem base, diz que não sabe', async () => {
  const semIa = { espacoId: null, provedor: 'local', estilo: 'amigavel', nome: 'Prumo', historico: [], autorizados: { claude: true }, executavel: () => null, executor: async () => { throw new Error('não deveria executar'); }, base };
  const r = await conversar({ ...semIa, pergunta: 'o que é teste de regressão?' });
  assert.equal(r.modo, 'LOCAL');
  assert.match(r.linhas.join(' '), /Teste de regressão/);
  assert.match(r.aviso ?? '', /base offline/);
  const s = await conversar({ ...semIa, pergunta: 'qual a capital da Austrália?' });
  assert.match(s.linhas.join(' '), /Conecte e autorize/);
});

test('o modo automático tenta as IAs em ordem, pula a que falhou e entrega a primeira resposta', async () => {
  const chamadas = [];
  const executor = async (exe, args) => {
    chamadas.push(exe);
    if (exe.includes('claude')) return { codigo: 1, saida: 'Claude usage limit reached', erro: '' };
    return { codigo: 0, saida: '**Severidade** é impacto técnico.\n\nPrioridade é urgência.', erro: '' };
  };
  const r = await conversar({ espacoId: null, pergunta: 'qual a diferença entre severidade e prioridade?', provedor: 'local', estilo: 'amigavel', nome: 'Prumo', historico: [],
    autorizados: { claude: true, copilot: true }, executavel: (p) => '/falso/' + p, executor, base });
  assert.equal(r.modo, 'COPILOT');
  assert.deepEqual(chamadas, ['/falso/claude', '/falso/copilot']);
  assert.match(r.linhas.join(' '), /Severidade/);
  // Claude acabou de bater no limite: a próxima pergunta nem tenta de novo.
  chamadas.length = 0;
  await conversar({ espacoId: null, pergunta: 'o que é teste de regressão?', provedor: 'local', estilo: 'amigavel', nome: 'Prumo', historico: [], autorizados: { claude: true, copilot: true }, executavel: (p) => '/falso/' + p, executor, base });
  assert.deepEqual(chamadas, ['/falso/copilot']);
});

test('a pesquisa na web só é liberada ao Claude nas perguntas gerais, e o prompt manda não inventar dados do projeto', () => {
  const sem = argumentosDoProvedorDeIa('claude', 'p', null);
  assert.equal(sem[sem.indexOf('--tools') + 1], '');
  assert.ok(!sem.includes('--allowedTools'));
  const com = argumentosDoProvedorDeIa('claude', 'p', null, true);
  assert.equal(com[com.indexOf('--tools') + 1], 'WebSearch,WebFetch');
  assert.deepEqual(com.slice(com.indexOf('--allowedTools') + 1, com.indexOf('--allowedTools') + 3), ['WebSearch', 'WebFetch']);
  const prompt = montarPromptGeral({ id: 'qa-geral', nome: 'QA Geral', dominio: 'QA', especializacao: null }, 'o que é BDD?', 'amigavel', 'Prumo');
  assert.match(prompt, /engenheiro\(a\) de qualidade sênior/);
  assert.match(prompt, /não invente dados do projeto/);
});

test('as sugestões de seguimento saem do texto e viram até três perguntas clicáveis', () => {
  const r = separarSugestoes('Resposta **boa**.\n\nSUGESTOES: Como decidir o que mockar? | Exemplo com Playwright | x | Onde entra contrato? | quarta que passa do limite');
  assert.equal(r.texto, 'Resposta **boa**.');
  assert.deepEqual(r.sugestoes.map((x) => x.pergunta), ['Como decidir o que mockar?', 'Exemplo com Playwright', 'Onde entra contrato?']);
  assert.deepEqual(separarSugestoes('só texto').sugestoes, []);
});
