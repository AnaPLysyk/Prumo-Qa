/**
 * QA do chat com o laboratório (backend/projetos/exemplos/projeto-demo, requisitos R1-R3).
 * Parte 1: acurácia do roteamento (escolherAgente, planejarOrquestracao, rastrearPergunta) com 92 perguntas reais de QA.
 * Parte 2: conversar() com executor falso nos 4 provedores. Nenhum CLI real roda; toda gravação vai para base temporária.
 * Parte 3: lacunas do próprio laboratório (já corrigidas; antes estavam como todo).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { escolherAgente, planejarOrquestracao } from '../../../../dist/agentes/chat/roteamento.js';
import { conversar, rastrearPergunta } from '../../../../dist/agentes/chat/conversar.js';
import { executarCliDeIa, argumentosDoProvedorDeIa } from '../../../../dist/agentes/chat/consultarIaExterna.js';
import { gravarEspacos } from '../../../../dist/projetos/banco/projetos.js';
import { adicionarVinculo } from '../../../../dist/projetos/servicoProjetos.js';
import { salvarAgentesDaPlataforma } from '../../../../dist/administracao/servico.js';
import { responderSomenteLeitura } from '../../../../dist/agentes/chat/conversar.js';
import { criarRepositorio } from '../../../../backend/projetos/exemplos/projeto-demo/publicacao.mjs';

const laboratorio = path.resolve('backend/projetos/exemplos/projeto-demo');
const base = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-qa-lab-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d; };

// ── Parte 1: roteamento ──
// [pergunta, agente esperado, (opcional) especialistas que a orquestração deve reunir]
const perguntas = [
['como priorizar os testes por risco?','qa-geral'],
['quais heuristicas usar pra ideias de teste?','qa-geral'],
['monta uma sessao exploratoria pra mim','qa-geral'],
['qual a estrategia de teste do laboratorio?','qa-geral'],
['me ajuda a escrever casos de teste manuais','qa-geral'],
['piramide de testes, o que e isso','qa-geral'],
['quais propostas de teste estao em rascunho?','qa-geral'],
['priorizar casos de R2','qa-geral'],
['o R1 e testavel?','requisitos'],
['como escrever criterio de aceite do titulo?','requisitos'],
['tem lacuna nos requisitos do laboratorio?','requisitos'],
['escreve um cenario em gherkin para publicar','requisitos'],
['esse requisito esta ambiguo, entre 1 e 80 inclusive?','requisitos'],
['rastreabilidade dos requisitos R1 R2 R3','requisitos'],
['quais regras de negocio existem para publicacao?','requisitos'],
['requisitos sem teste','requisitos'],
['como fazer seletores estaveis no playwright?','playwright'],
['testar mobile no e2e','playwright'],
['qual a melhor estrategia pra automatizar a tela de login?','playwright'],
['page object vale a pena?','playwright'],
['teste de navegador pra salvar publicacao','playwright'],
['playwrite esta lento','playwright'],
['cypress ou playwright?','playwright'],
['como esperar elemento aparecer na interface','playwright'],
['qual o checklist de teste de api?','api-rest'],
['o endpoint devolve 403 pro Leitor?','api-rest'],
['validar o contrato do payload json','api-rest'],
['como testar status code 422?','api-rest'],
['tem swagger do servico?','api-rest'],
['teste de integracao http','api-rest'],
['how do I test a REST endpoint?','api-rest'],
['api','api-rest'],
['como fazer uma verificacao rapida de acessibilidade?','acessibilidade'],
['o contraste do botao esta ok?','acessibilidade'],
['navegacao por teclado funciona?','acessibilidade'],
['quais criterios wcag aplicar?','acessibilidade'],
['leitor de tela le o formulario?','acessibilidade'],
['a11y checklist','acessibilidade'],
['acessibildade do titulo','acessibilidade'],
['tem aria-label nos campos?','acessibilidade'],
['o que falhou e qual a causa provavel?','investigacao-bugs'],
['como escrever um bom relato de bug?','investigacao-bugs'],
['o que fazer com teste flaky?','investigacao-bugs'],
['achei um bug ao salvar com 81 caracteres','investigacao-bugs'],
['por que o teste quebrou?','investigacao-bugs'],
['classifique as ultimas falhas','investigacao-bugs'],
['teste intermitente no CI','investigacao-bugs'],
['investigar erro 500','investigacao-bugs'],
['bug bug bug','investigacao-bugs'],
['como escolher o que rodar na regressao?','regressao'],
['quando roda a proxima rotina agendada?','regressao'],
['o smoke passou?','regressao'],
['quantas execucoes tivemos hoje?','regressao'],
['preciso agendar uma suite','regressao'],
['regressao do laboratorio','regressao'],
['resultado da ultima rodada','regressao'],
['run result','regressao'],
['como ler as metricas de execucao?','monitoramento'],
['o que mudou recentemente no projeto?','monitoramento'],
['mostra o historico de atividades','monitoramento'],
['timeline do projeto','monitoramento'],
['grafico de falhas por semana','monitoramento',['monitoramento','investigacao-bugs']],
['o que aconteceu ontem?','monitoramento'],
['oi','orquestrador'],
['bom dia','orquestrador'],
['como vincular um projeto?','orquestrador'],
['onde fica a configuracao de tema?','orquestrador'],
['o que voce faz?','orquestrador'],
['como conectar o jira?','orquestrador'],
['ajuda','orquestrador'],
['como funciona o banco de conhecimento?','orquestrador'],
['asdkjh qwe','orquestrador'],
['?','orquestrador'],
['quais falhas aconteceram e como esta a regressao?','investigacao-bugs',['investigacao-bugs','regressao']],
['o teste de api falhou, qual o erro?','investigacao-bugs',['api-rest','investigacao-bugs']],
['cobertura de requisitos e metricas de execucao','requisitos'],
['o teste e2e do playwright esta flaky','investigacao-bugs',['playwright','investigacao-bugs']],
['acessibilidade e teclado na tela de publicacao','acessibilidade'],
['@playwright oi','playwright'],
['@regressao como esta o status?','regressao'],
['tá quebrando tudo aqui, socorro','investigacao-bugs'],
['qual a cobertura do R3?','requisitos'],
['teste falhou de novo','investigacao-bugs'],
['why did the test fail?','investigacao-bugs'],
['what is the coverage of the requirements?','requisitos'],
['how to prioritize tests by risk','qa-geral'],
['regresao passou?','regressao'],
['quero testar o endpoint de salvar publicacao','api-rest'],
['limites do titulo 0 1 80 81 estao cobertos?','requisitos'],
['perfil desconhecido pode salvar?','requisitos'],
['gravacao recusada altera os dados?','requisitos'],
['como testar a tela de publicacao?','playwright'],
];

const resultado = (q, multi) => {
  const r = escolherAgente(q, null, {}); const plano = planejarOrquestracao(r.rota);
  return { r, plano, certo: multi ? !!(plano && multi.every((m) => plano.includes(m))) : r.agente.id === perguntas.find((p) => p[0] === q)[1] && !plano };
};

test('o conjunto tem pelo menos 60 perguntas e cobre os 8 agentes e o orquestrador', () => {
  assert.ok(perguntas.length >= 60);
  assert.deepEqual([...new Set(perguntas.map((p) => p[1]))].sort(), ['acessibilidade', 'api-rest', 'investigacao-bugs', 'monitoramento', 'orquestrador', 'playwright', 'qa-geral', 'regressao', 'requisitos']);
});

test('acurácia do roteamento (agente certo e sem orquestração indevida) fica em pelo menos 95%', () => {
  const certas = perguntas.filter(([q, , multi]) => resultado(q, multi).certo).length;
  assert.ok(certas / perguntas.length >= 0.95, `acurácia ${(100 * certas / perguntas.length).toFixed(1)}% (${certas}/${perguntas.length})`);
});

test('toda pergunta do conjunto é roteada para o agente esperado', () => {
  for (const [q, esperado, multi] of perguntas) {
    const { r, plano, certo } = resultado(q, multi);
    assert.ok(certo, `"${q}": esperado ${multi ? 'plano ' + multi : esperado}, obtido ${plano ? 'plano ' + plano : r.agente.id}`);
  }
});

test('gráfico de falhas: o Monitoramento lidera e a Investigação de Bugs entra no plano', () => {
  const r = escolherAgente('grafico de falhas por semana', null, {});
  assert.equal(r.agente.id, 'monitoramento'); assert.deepEqual(planejarOrquestracao(r.rota), ['monitoramento', 'investigacao-bugs']);
});

test('erro de digitação em termo longo e perguntas em inglês chegam ao agente certo (frases fora do conjunto)', () => {
  assert.equal(escolherAgente('playwrigth nao abre o navegador', null, {}).agente.id, 'playwright');
  assert.equal(escolherAgente('acceptance criteria for the requirement', null, {}).agente.id, 'requisitos');
  assert.equal(escolherAgente('test coverage report', null, {}).agente.id, 'requisitos');
});

test('palavras comuns parecidas com termos longos não são tratadas como erro de digitação', () => {
  assert.equal(escolherAgente('como funciona o aplicativo?', null, {}).agente.id, 'orquestrador');
  assert.equal(escolherAgente('como mudar meu perfil?', null, {}).agente.id, 'orquestrador');
});

test('rastrearPergunta concorda com escolherAgente e planejarOrquestracao em todas as perguntas, sem chamar IA', (t) => {
  const b = base(t);
  for (const [q] of perguntas) {
    const chat = escolherAgente(q, null, {}); const rastro = rastrearPergunta(q, null, null, b);
    assert.equal(rastro.escolhido.id, chat.agente.id, q);
    assert.deepEqual(rastro.orquestracao, planejarOrquestracao(chat.rota), q);
    assert.equal(rastro.escolhido.porPadrao, chat.rota.length === 0, q);
  }
});

test('menção explícita (@agente) vence o vocabulário e mensagens sem termo caem no orquestrador', () => {
  assert.equal(escolherAgente('@api-rest como esta a regressao e as falhas?', null, {}).agente.id, 'api-rest');
  for (const q of ['asdkjh qwe', '?', '']) assert.equal(escolherAgente(q, null, {}).agente.id, 'orquestrador', q);
});

test('agentes desligados na Administração não são escolhidos nem entram no plano', () => {
  const r = escolherAgente('o teste de api falhou, qual o erro?', null, { desligados: ['api-rest'] });
  assert.ok(!r.rota.some((x) => x.agente === 'api-rest'));
});

// ── Parte 2: conversar() com executor falso ──
const provedores = [['claude', 'CLAUDE'], ['codex', 'CODEX'], ['copilot', 'COPILOT'], ['gemini', 'GEMINI']];
// As 4 consultas originais + perguntar_ao_orquestrador (somente leitura, adicionada em 21/10/2026). Qualquer outra ferramenta deve quebrar este teste.
const ferramentasDeConsulta = ['contexto_projeto', 'revisar_cobertura', 'consultar_evidencias', 'listar_politicas', 'perguntar_ao_orquestrador'];

/** Base temporária com um projeto "Laboratório" apontando para o projeto de exemplo (somente leitura; o MCP nunca é iniciado). */
function ambiente(t) {
  const b = base(t); const espacoId = randomUUID();
  gravarEspacos({ version: 1, espacos: [{ id: espacoId, nome: 'Laboratório', descricao: '', criadoEm: new Date().toISOString(), pastaLocal: laboratorio, raizContextos: '', vinculos: [], relacoes: [], historico: [] }] }, b);
  return { b, espacoId };
}
const perguntar = (t, provedor, executor, extra = {}) => {
  const { b, espacoId } = ambiente(t);
  return conversar({ pergunta: 'o R2 do laboratorio e testavel?', espacoId, provedor, base: b, autorizados: { [provedor]: true }, executavel: () => 'ia.exe', executor, ...extra });
};

for (const [provedor, modo] of provedores) {
  test(`${provedor}: provedor não autorizado não executa nada e responde local com aviso`, async (t) => {
    let executou = false;
    const r = await perguntar(t, provedor, async () => { executou = true; return { codigo: 0, saida: 'x', erro: '' }; }, { autorizados: {} });
    assert.equal(executou, false); assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /não autorizada/);
  });

  test(`${provedor}: autorizar só outro provedor não libera este`, async (t) => {
    let executou = false; const outro = provedor === 'claude' ? 'gemini' : 'claude';
    const r = await perguntar(t, provedor, async () => { executou = true; return { codigo: 0, saida: 'x', erro: '' }; }, { autorizados: { [outro]: true } });
    assert.equal(executou, false); assert.equal(r.modo, 'LOCAL');
  });

  test(`${provedor}: saída vazia ou só espaços volta à resposta local com aviso`, async (t) => {
    for (const saida of ['', '   \n\n  ']) {
      const r = await perguntar(t, provedor, async () => ({ codigo: 0, saida, erro: '' }));
      assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /não respondeu/);
    }
  });

  test(`${provedor}: timeout (código nulo) usa 120000 ms e volta à resposta local avisando tempo esgotado`, async (t) => {
    let opcoes;
    const r = await perguntar(t, provedor, async (_e, _a, o) => { opcoes = o; return { codigo: null, saida: 'parcial', erro: '' }; });
    assert.equal(opcoes.timeoutMs, 120000); assert.equal(r.modo, 'LOCAL'); assert.match(r.aviso, /tempo esgotado/);
    assert.doesNotMatch(r.linhas.join('\n'), /parcial/, 'saída parcial de um processo morto não pode virar resposta');
  });

  test(`${provedor}: exceção do executor e código de saída 1 voltam à resposta local`, async (t) => {
    for (const executor of [async () => { throw new Error('boom'); }, async () => ({ codigo: 1, saida: 'erro', erro: 'x' })]) {
      const r = await perguntar(t, provedor, executor);
      assert.equal(r.modo, 'LOCAL'); assert.ok(r.aviso);
    }
  });

  test(`${provedor}: segredos de token, Bearer e GitHub saem mascarados da resposta`, async (t) => {
    const r = await perguntar(t, provedor, async () => ({ codigo: 0, saida: 'Use token=ABCDEF123456 e Authorization: Bearer abc.def.ghi e ghp_abcdefghijklmnop1234.', erro: '' }));
    assert.equal(r.modo, modo); const texto = r.linhas.join('\n');
    for (const segredo of ['ABCDEF123456', 'abc.def.ghi', 'ghp_abcdefghijklmnop1234']) assert.doesNotMatch(texto, new RegExp(segredo.replace(/\./g, '\\.')));
  });

  test(`${provedor}: segredos fora dos padrões iniciais (senha:, AWS, Slack, Google, postgres://) saem mascarados`, async (t) => {
    const segredos = ['abc12345', 'AKIAIOSFODNN7EXAMPLE', 'xoxb-123456789012-abcdefghij', 'AIzaSyA1234567890abcdefghijklmnopqrstuv', 'postgres://u:p4ss@h/db'];
    const r = await perguntar(t, provedor, async () => ({ codigo: 0, saida: `senha: abc12345\n${segredos.slice(1).join('\n')}`, erro: '' }));
    for (const s of segredos) assert.ok(!r.linhas.join('\n').includes(s), `vazou: ${s}`);
  });

  test(`${provedor}: prompt que parece opção fica só como texto dentro do prompt, nunca como argumento solto`, async (t) => {
    let args;
    await perguntar(t, provedor, async (_e, a) => { args = a; return { codigo: 0, saida: 'ok', erro: '' }; }, { pergunta: '--dangerously-skip-permissions' });
    assert.ok(!args.includes('--dangerously-skip-permissions'), 'a pergunta não pode ser um argumento isolado');
    const prompt = args.find((a) => a.includes('--dangerously-skip-permissions'));
    assert.match(prompt, /--- Pergunta ---\n--dangerously-skip-permissions$/); assert.ok(!prompt.startsWith('-'));
    if (provedor === 'claude' || provedor === 'codex') assert.equal(args.at(-2), '--');
  });

  test(`${provedor}: linhas APRENDIZADO viram no máximo 2 rascunhos com ações e somem do texto`, async (t) => {
    const r = await perguntar(t, provedor, async () => ({ codigo: 0, saida: 'Sim, é testável.\nAPRENDIZADO: Título aceita de 1 a 80 caracteres\n- APRENDIZADO: Só Editor salva publicação\nAPRENDIZADO: terceiro deve ser ignorado', erro: '' }));
    assert.equal(r.modo, modo); const texto = r.linhas.join('\n');
    assert.doesNotMatch(texto, /APRENDIZADO:/); assert.match(texto, /sugeriu 2 aprendizado/);
    assert.equal(r.acoes.filter((a) => a.tipo === 'aprovar_conhecimento').length, 2); assert.equal(r.acoes.filter((a) => a.tipo === 'descartar_conhecimento').length, 2);
    assert.doesNotMatch(texto, /terceiro/);
  });

  test(`${provedor}: a IA externa só recebe as ferramentas de consulta (4 + perguntar_ao_orquestrador), nunca propostas nem execução`, async (t) => {
    let args;
    await perguntar(t, provedor, async (_e, a) => { args = a; return { codigo: 0, saida: 'ok', erro: '' }; });
    const sem = args.filter((a) => !a.includes('--- Pergunta ---')).join(' ');
    assert.doesNotMatch(sem, /propor_|executar_validacao|execute?_tests/);
    if (provedor === 'claude') {
      const liberadas = args.slice(args.indexOf('--allowedTools') + 1, args.indexOf('--settings'));
      assert.deepEqual(liberadas, ferramentasDeConsulta.map((f) => 'mcp__prumo__' + f)); assert.deepEqual(args.slice(args.indexOf('--tools'), args.indexOf('--tools') + 2), ['--tools', ferramentasDeConsulta.map((f) => 'mcp__prumo__' + f).join(',')]);
    }
    if (provedor === 'codex') {
      assert.match(sem, /enabled_tools=\["contexto_projeto","revisar_cobertura","consultar_evidencias","listar_politicas","perguntar_ao_orquestrador"\]/); assert.ok(args.includes('read-only')); assert.ok(args.includes('shell_tool'));
    }
    if (provedor === 'copilot') {
      assert.deepEqual(args.slice(args.indexOf('--available-tools') + 1), ferramentasDeConsulta.map((f) => `prumo(${f})`));
      const mcp = JSON.parse(args[args.indexOf('--additional-mcp-config') + 1]); assert.deepEqual(mcp.mcpServers.prumo.tools, ferramentasDeConsulta);
      assert.ok(args.includes('--deny-tool=shell') && args.includes('--deny-tool=write'));
    }
    if (provedor === 'gemini') { assert.deepEqual(args.slice(0, 1), ['--prompt']); assert.ok(args.includes('--allowed-mcp-server-names')); } // política e MCP temporários são escritos pelo executor.
  });

  test(`${provedor}: sem projeto vinculado não há MCP nem ferramenta liberada`, async (t) => {
    let args;
    await conversar({ pergunta: 'oi', espacoId: null, provedor, base: base(t), autorizados: { [provedor]: true }, executavel: () => 'ia.exe', executor: async (_e, a) => { args = a; return { codigo: 0, saida: 'ok', erro: '' }; } });
    const todo = args.join(' ');
    assert.doesNotMatch(todo.replace(/--- Pergunta ---[\s\S]*$/, ''), /mcp__prumo|enabled_tools|allow-tool=prumo|additional-mcp-config/);
  });
}

test('executarCliDeIa com executável inexistente: aviso de erro de execução, sem "tempo esgotado" e sem vazar o caminho', async (t) => {
  const { b, espacoId } = ambiente(t);
  const r = await conversar({ pergunta: 'oi', espacoId, provedor: 'claude', base: b, autorizados: { claude: true }, executavel: () => 'nao-existe-xyz-prumo', executor: executarCliDeIa });
  assert.equal(r.modo, 'LOCAL'); assert.doesNotMatch(r.aviso, /tempo esgotado|nao-existe-xyz-prumo/); assert.match(r.aviso, /erro de execução/);
});

test('IA externa desligada na Administração: o aviso cita os quatro provedores e o executor não roda', async (t) => {
  const b = base(t); salvarAgentesDaPlataforma({ desligados: [], iaExterna: false, orquestracao: true }, b);
  let executou = false;
  const r = await conversar({ pergunta: 'oi', espacoId: null, provedor: 'gemini', base: b, autorizados: { gemini: true }, executavel: () => 'ia.exe', executor: async () => { executou = true; return { codigo: 0, saida: 'x', erro: '' }; } });
  assert.equal(executou, false); assert.equal(r.modo, 'LOCAL');
  for (const nome of ['Claude Code', 'Codex', 'GitHub Copilot', 'Gemini CLI']) assert.ok(r.aviso.includes(nome), nome);
});

test('executor que informa falha de execução vira aviso próprio; código nulo sem a marca continua sendo tempo esgotado', async (t) => {
  const falha = await perguntar(t, 'codex', async () => ({ codigo: null, saida: '', erro: 'C:\Users\pessoa\segredo\codex.exe: ENOENT', falhaAoExecutar: true }));
  assert.match(falha.aviso, /erro de execução/); assert.doesNotMatch(falha.aviso, /tempo esgotado|Users|ENOENT/);
  const tempo = await perguntar(t, 'codex', async () => ({ codigo: null, saida: '', erro: '' }));
  assert.match(tempo.aviso, /tempo esgotado/);
});

test('responderSomenteLeitura repassa a base temporária a contextos e histórico (Requisitos e Monitoramento)', async (t) => {
  const { b, espacoId } = ambiente(t);
  await adicionarVinculo(laboratorio, b);
  gravarEspacos({ version: 1, espacos: [{ id: espacoId, nome: 'Laboratório', descricao: '', criadoEm: new Date().toISOString(), pastaLocal: laboratorio, raizContextos: laboratorio, vinculos: [], relacoes: [], historico: [] }] }, b);
  for (const agente of ['requisitos', 'monitoramento']) {
    const r = await responderSomenteLeitura('quais contextos e historico existem?', espacoId, agente, b);
    assert.doesNotMatch(r.linhas.join(' '), /Não consegui ler/, agente);
  }
});

test('argumentosDoProvedorDeIa: o prompt é sempre o último argumento de Claude e Codex, depois de --', () => {
  for (const p of ['claude', 'codex']) { const a = argumentosDoProvedorDeIa(p, '-x', laboratorio); assert.deepEqual(a.slice(-2), ['--', '-x']); }
});

// ── Parte 3: o próprio laboratório (R1-R3) ──
test('laboratório R3: gravação recusada por título inválido não altera o valor existente', () => {
  const r = criarRepositorio(); r.salvar('Editor', 'a', 'Antes');
  assert.equal(r.salvar('Editor', 'a', '').status, 422); assert.equal(r.salvar('Editor', 'a', 'x'.repeat(81)).status, 422); assert.equal(r.ler('a'), 'Antes');
});
test('laboratório R1: perfil desconhecido, vazio ou com outra caixa é recusado com 403', () => {
  for (const perfil of ['editor', 'EDITOR', 'Editor ', '', null, undefined, 'Admin']) assert.equal(criarRepositorio().salvar(perfil, 'a', 'T').status, 403, String(perfil));
});
test('laboratório R2: título não textual é recusado com 422', () => {
  for (const t of [null, undefined, 5, {}, ['a']]) assert.equal(criarRepositorio().salvar('Editor', 'a', t).status, 422, String(t));
});
test('laboratório R2: 41 emojis são 41 caracteres visíveis e deveriam caber em 80', () => {
  assert.equal(criarRepositorio().salvar('Editor', 'a', '😀'.repeat(41)).status, 200);
});
test('laboratório: id vazio ou ausente não deveria ser aceito', () => {
  assert.equal(criarRepositorio().salvar('Editor', '', 'T').status, 422); assert.equal(criarRepositorio().salvar('Editor', undefined, 'T').status, 422);
});
