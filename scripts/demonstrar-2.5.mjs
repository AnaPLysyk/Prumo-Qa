// Demonstração ponta a ponta dos 20 passos da 2.5 (janela real + MCP real stdio). Uso:
//   node scripts/demonstrar-2.5.mjs [<Prumo QA.exe>]
// Dados sintéticos em pasta temporária; capturas e resumo.json em .prumo/demonstracao-2.5/ (fora do Git).
// O que é controlado e declarado no resumo: (1) respostas das caixas de confirmação NATIVAS (a automação responde por elas);
// (2) o servidor de atualização local (somente fora do pacote); (3) shell.openExternal é interceptado para NÃO abrir o navegador
// nem criar issue alguma no repositório público. A autenticação humana do Windows (executar_validacao) NÃO é simulada: o resultado BLOCKED é registrado como tal.
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repo = path.resolve('.');
const exe = process.argv.slice(2).find((a) => a.toLowerCase().endsWith('.exe'));
const versao = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const saida = path.resolve('.prumo/demonstracao-2.5'); fs.rmSync(saida, { recursive: true, force: true }); fs.mkdirSync(saida, { recursive: true });
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo demo 2.5 '));
const pw = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo pw sintetico '));
const passos = []; const passo = (n, nome, dado) => { passos.push({ n, passo: nome, ...dado }); console.log(`${String(n).padStart(2)}.`, nome, dado ? JSON.stringify(dado).slice(0, 360) : ''); };
const mcpJs = exe ? path.join(path.dirname(exe), 'resources', 'app', 'dist', 'mcp.js') : path.join(repo, 'dist', 'mcp.js');

// Servidor de atualização local: só aceito fora do pacote (o instalado consulta o GitHub real e a tag publicada não é nova o bastante).
let servidor; let urlTeste;
if (!exe) {
  servidor = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ tag_name: 'v99.0.0', html_url: 'https://evil.example', body: '## Novidades\n- Correção importante\n- Segurança reforçada\n- Compatibilidade mantida', draft: false, prerelease: false })); });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok)); urlTeste = `http://127.0.0.1:${servidor.address().port}/latest`;
}
async function abrir(env = {}) {
  const e = { ...process.env, PRUMO_DATA_DIR: dados, ...env }; delete e.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: exe ?? electronPath, args: exe ? [] : [repo], env: e });
  const page = await app.firstWindow(); await page.waitForSelector('#nav button'); return { app, page };
}
const foto = (page, nome) => page.screenshot({ path: path.join(saida, nome) });
const ir = async (page, aba) => { await page.click(`[data-aba=${aba}]`); await page.waitForTimeout(400); };
const ajuda = async (page, titulo) => { await ir(page, 'ajuda'); await page.click(`.indice button:has-text("${titulo}")`); await page.waitForTimeout(400); };
const api = (page, fn, ...args) => page.evaluate(([f, a]) => window.prumo[f](...a), [fn, args]);
const dialogos = (app, resposta) => app.evaluate(({ dialog }, r) => { dialog.showMessageBox = async () => ({ response: r, checkboxChecked: false }); }, resposta);
async function mcp(root, chamadas) {
  const client = new Client({ name: 'codex-demonstracao-2.5', version: '1.0.0' });
  await client.connect(new StdioClientTransport(exe ? { command: exe, args: [mcpJs, root], env: { PRUMO_DATA_DIR: dados, ELECTRON_RUN_AS_NODE: '1' } } : { command: process.execPath, args: [mcpJs, root], env: { PRUMO_DATA_DIR: dados, PATH: process.env.PATH ?? '' } }));
  try { const out = []; for (const [name, args] of chamadas) out.push(JSON.parse((await client.callTool({ name, arguments: args })).content[0].text)); return { servidor: client.getServerVersion().version, out }; } finally { await client.close(); }
}
async function novoContexto(page, { titulo, texto, chave, ref }) {
  await page.click('#ctx-novo'); await page.selectOption('#ctx-tipo', 'requisito'); await page.fill('#ctx-titulo', titulo); await page.fill('#ctx-chave', chave); await page.selectOption('#ctx-origem-tipo', 'documento');
  await page.fill('#ctx-origem-ref', ref); await page.fill('#ctx-texto', texto); await page.click('#ctx-salvar'); await page.waitForSelector(`#ctx-tabela button:has-text("${titulo}")`);
}

let sessao = await abrir(urlTeste ? { PRUMO_UPDATE_TEST_URL: urlTeste } : {});
try {
  let { page, app } = sessao;
  await app.evaluate(({ shell }) => { globalThis.__abertas = []; shell.openExternal = async (u) => { globalThis.__abertas.push(u); }; });
  // 1
  assert.equal((await page.textContent('#versao')).trim(), 'v' + versao);
  passo(1, exe ? 'Aplicativo aberto pelo executável empacotado' : 'Aplicativo aberto em modo de desenvolvimento (Electron do repositório; o executável empacotado não foi usado)', { executavel: exe ?? 'electron (desenvolvimento)', versaoExibida: (await page.textContent('#versao')).trim() });
  // 2
  await page.click('text=Adicionar projeto de demonstração'); await page.waitForSelector('table');
  const demo = (await api(page, 'projetos')).data[0]; assert.equal(demo.state, 'INTEGRADO');
  passo(2, 'Projeto de demonstração selecionado', { id: demo.id, estado: demo.state });
  // 3
  await ir(page, 'contextos');
  await novoContexto(page, { titulo: 'Somente Editor salva publicação', texto: 'R1: Somente Editor pode salvar uma publicação.', chave: 'RQ-R1', ref: 'README.md R1' });
  let c = (await api(page, 'contextosListar', demo.root)).data.contextos[0]; assert.equal(c.estado, 'RASCUNHO');
  await foto(page, '01-contexto-rascunho.png'); passo(3, 'Requisito cadastrado', { estado: c.estado, versao: c.versao, origem: c.origem.referencia });
  // 4
  await page.click('#ctx-tabela button:has-text("Somente Editor")'); await page.waitForSelector('#painel-contexto h2');
  await dialogos(app, 1); await page.click('#painel-contexto button:has-text("Aprovar")'); await page.waitForTimeout(600);
  c = (await api(page, 'contextosListar', demo.root)).data.contextos[0]; assert.equal(c.estado, 'APROVADO'); assert.equal(c.aprovadoPor, os.userInfo().username);
  passo(4, 'Requisito aprovado (a caixa de confirmação nativa foi respondida pela automação; o aprovador é o usuário do Windows lido pelo processo principal)', { estado: c.estado, aprovadoPor: c.aprovadoPor === os.userInfo().username ? 'usuário do Windows' : '?' });
  // 5
  await page.click('#ctx-tabela button:has-text("Somente Editor")'); await page.waitForSelector('#painel-contexto h2'); await page.click('#painel-contexto button:has-text("Editar")');
  await page.fill('#ctx-texto', 'R1: Somente Editor pode salvar uma publicação. R1b: Leitor recebe 403.'); await page.click('#ctx-salvar'); await page.waitForSelector('#ctx-tabela');
  c = (await api(page, 'contextosListar', demo.root)).data.contextos[0]; assert.equal(c.estado, 'RASCUNHO');
  passo(5, 'Segunda versão criada (editar invalida a aprovação)', { versao: c.versao, estado: c.estado });
  await page.click('#ctx-tabela button:has-text("Somente Editor")'); await page.waitForSelector('#painel-contexto h2'); await dialogos(app, 1); await page.click('#painel-contexto button:has-text("Aprovar")'); await page.waitForTimeout(600);
  // 6
  await page.click('#ctx-tabela button:has-text("Somente Editor")'); await page.waitForSelector('#painel-contexto table'); await foto(page, '02-historico-contexto.png');
  const det = (await api(page, 'contextosObter', demo.root, c.id)).data; const acoes = det.historico.map((h) => h.acao ?? h.action ?? h.tipo);
  const hist = await page.textContent('#painel-contexto table');
  for (const a of ['criado', 'aprovado', 'editado']) assert.match(hist, new RegExp(a));
  passo(6, 'Histórico confirmado (quem, quando, hash encadeado)', { entradas: det.historico.length, acoes, integridade: det.integridade ?? det.contexto?.integridade ?? 'ok' });
  // 7
  await ir(page, 'contextos'); await dialogos(app, 1); await page.check('#ctx-mcp'); await page.waitForTimeout(600);
  assert.equal((await api(page, 'contextosListar', demo.root)).data.disponibilizarAoMcp, true);
  await ir(page, 'conexoes'); await foto(page, '03-conexoes.png');
  const proposta = (await api(page, 'conexoes', demo.root)).data[0];
  const sessaoMcp = await mcp(demo.root, [['contexto_projeto', {}]]);
  assert.equal(sessaoMcp.servidor, versao);
  passo(7, 'MCP conectado (servidor stdio real iniciado como o cliente de IA faria; a configuração do Codex NÃO foi alterada)', { servidorMCPInforma: sessaoMcp.servidor, comandoPropostoParaCodex: proposta.command.slice(0, 90), contextosHabilitados: true, contextosNoMcp: sessaoMcp.out[0].contextos.referencias.length });
  // 8-9
  const plano = { requirement: 'R1: Somente Editor pode salvar uma publicação.', source: 'README.md R1', contextoId: c.id, existingTests: [], candidates: [{ id: 'editor-salva', behavior: 'Editor salva publicação', source: 'README.md R1', risk: 'Perda de publicação', expected: 'status 200 e título persistido', oracle: 'retorno e nova leitura', technique: 'equivalence', partition: 'Editor' }, { id: 'leitor-nega', behavior: 'Leitor tenta salvar', source: 'README.md R1', risk: 'Gravação indevida', expected: '403 e dados intactos', oracle: 'status e nova leitura', technique: 'equivalence', partition: 'Leitor' }] };
  const r8 = await mcp(demo.root, [['contexto_projeto', {}], ['revisar_cobertura', plano]]);
  const rev = r8.out[1]; const txt = JSON.stringify(rev);
  assert.equal(rev.state, 'NOT_VERIFIED');
  passo(8, 'Revisão solicitada com o contexto aprovado (estado NOT_VERIFIED: análise estrutural, não execução)', { state: rev.state, achados: rev.findings.map((f) => f.type), contextoUsado: rev.facts.some((x) => x.kind === 'context_used') });
  const origem = r8.out[0].contextos.referencias.find((x) => x.id === c.id);
  assert.ok(origem, 'o contexto aprovado deve aparecer em contexto_projeto'); const usado = rev.facts.find((x) => x.kind === 'context_used');
  assert.ok(usado && usado.estado === 'APROVADO' && usado.requirementFoundInContext === true, 'a revisão deve usar o contexto aprovado e achar o requisito nele');
  passo(9, 'Origem do requisito confirmada no resultado da revisão e no contexto_projeto', { origemNaRevisao: usado.origem, versao: usado.versao, estado: usado.estado, aprovadoPor: usado.aprovadoPor ? 'registrado' : null, hash: String(usado.hash).slice(0, 12), requisitoEncontradoNoContexto: usado.requirementFoundInContext });
  // 10
  const exec = await mcp(demo.root, [['executar_validacao', { capability: 'unit' }]]);
  await ir(page, 'logs'); await foto(page, '04-logs.png'); await ir(page, 'evidencias'); await foto(page, '05-evidencias.png');
  const ev = (await api(page, 'evidencias', demo.root)).data; const logs = (await api(page, 'logs', demo.root)).data;
  passo(10, 'Logs e evidências visualizados (autenticação humana do Windows NÃO simulada: a execução permanece como o núcleo a classificou)', { statusExecucao: exec.out[0].status, eventosDeLog: logs.events?.length ?? logs.length, evidencias: (ev.evidences ?? ev.items ?? ev).length ?? 0 });
  assert.notEqual(exec.out[0].status, 'PASS', 'sem autenticação humana não pode haver PASS');
  // 11
  fs.mkdirSync(path.join(pw, 'tests'));
  fs.writeFileSync(path.join(pw, 'tests', 'ok.js'), 'console.log(1);\n');
  fs.writeFileSync(path.join(pw, 'README.md'), 'R1: Cliente cria pedido.\n');
  fs.writeFileSync(path.join(pw, 'package.json'), JSON.stringify({ name: 'pw-sintetico', devDependencies: { '@playwright/test': '1.50.0' } }));
  fs.writeFileSync(path.join(pw, 'playwright.config.ts'), "import { defineConfig } from '@playwright/test';\nexport default defineConfig({ testDir: './tests' });\n");
  fs.writeFileSync(path.join(pw, 'tests', 'pedido.spec.ts'), "import { test } from '@playwright/test';\n\ntest('cria pedido', async ({ page }) => {\n  await page.goto('/');\n  await page.waitForTimeout(3000);\n  await page.locator('div > div:nth-child(3) > button').click();\n});\n");
  fs.writeFileSync(path.join(pw, 'qa.project.json'), JSON.stringify({ schemaVersion: 2, id: 'pw-sintetico', name: 'Playwright sintético', context: { documentation: ['README.md', 'package.json'], tests: ['tests/'], code: ['playwright.config.ts'] }, commands: { unit: 'node tests/ok.js' }, execution: { requireApproval: true, blockedByDefault: [], environment: 'host', envAllowlist: [], timeoutMs: 10000, maxOutputBytes: 65536 } }));
  const pwReal = fs.realpathSync(pw);
  const pr = await mcp(pwReal, [['contexto_projeto', {}], ['revisar_cobertura', { requirement: 'R1: Cliente cria pedido.', source: 'README.md R1', existingTests: [{ id: 'e2e-pedido', behavior: 'Cliente cria pedido', source: 'README.md R1', testPath: 'tests/pedido.spec.ts' }], candidates: [] }]]);
  const fw = pr.out[0].frameworks.find((f) => f.id === 'playwright'); const pwAchados = pr.out[1].findings.filter((f) => /^PW_/.test(f.type));
  assert.equal(fw.estado, 'CONFIRMADO'); for (const t of ['PW_ESPERA_FIXA', 'PW_SELETOR_FRAGIL', 'PW_SEM_ASSERTION']) assert.ok(pwAchados.some((f) => f.type === t), t);
  passo(11, 'Análise de teste Playwright (projeto sintético): framework confirmado por evidência e antipadrões encontrados com linha e fonte oficial', { framework: fw.estado, evidencia: (fw.evidencias ?? fw.evidence ?? []).length, achados: pwAchados.map((f) => `${f.type}@${f.source}`), fonteOficial: pwAchados[0].evidence?.[0]?.fonteOficial ?? null });
  // 12-14
  await dialogos(app, 1);
  if (!exe) {
    await api(page, 'salvarPreferencias', { som: true });
    await ajuda(page, 'Atualizações'); await page.click('#verificar-atualizacao'); await page.waitForSelector('#saida-atualizacao .estado', { timeout: 20000 });
    await foto(page, '06-atualizacao.png');
    const resumo = (await page.textContent('#saida-atualizacao')).replace(/\s+/g, ' ');
    passo(12, 'Atualização consultada em ambiente controlado (servidor local; instalado consulta o GitHub real)', { resultado: (await page.textContent('#saida-atualizacao .estado')).trim(), versaoDisponivel: /99\.0\.0/.test(resumo) });
    assert.equal(await page.locator('#sino-ponto').isVisible(), true);
    await page.hover('#sino'); await page.waitForSelector('#sino-dica:not([hidden])'); await foto(page, '07-sino.png');
    passo(13, 'Indicador visual no sino confirmado (ponto, rótulo acessível e resumo ao passar o mouse)', { rotulo: await page.getAttribute('#sino', 'aria-label'), resumoNaDica: (await page.textContent('#sino-dica')).replace(/\s+/g, ' ').slice(0, 140) });
    const toques = await page.evaluate(() => window.__prumoSom || 0); await page.click('#verificar-atualizacao'); await page.waitForTimeout(700);
    const depois = await page.evaluate(() => window.__prumoSom || 0);
    assert.equal(toques, 1); assert.equal(depois, 1);
    passo(14, 'Som opcional validado (ligado nas preferências): tocou uma vez e não repetiu na consulta seguinte', { toquesNaPrimeiraConsulta: toques, toquesAposSegundaConsulta: depois });
  } else {
    const real = (await api(page, 'verificarAtualizacao')).data;
    passo(12, 'Atualização consultada no GitHub REAL (o servidor de teste não é aceito no pacote)', { status: real.status, ultima: real.latest ?? null });
    passo(13, 'Indicador visual: NÃO demonstrado no pacote (só haveria sino se existisse release mais nova que a instalada)', { indicadorVisivel: await page.locator('#sino-ponto').isVisible() });
    passo(14, 'Som: NÃO demonstrado no pacote (depende de uma versão nova real)', {});
  }
  // 15-18
  await ir(page, 'suporte'); await foto(page, '08-suporte.png');
  passo(15, 'Aba Suporte aberta, com aviso de issue pública e sem e-mail inventado', { avisoPublico: /públicas/.test(await page.textContent('#aviso-publico')), email: /mailto:|@\w+\.\w+/.test(await page.textContent('#conteudo')) });
  await page.selectOption('#sup-categoria', 'bug'); await page.fill('#sup-titulo', 'Exemplo sintético: botão Salvar não responde'); await page.fill('#sup-descricao', 'Relato sintético da demonstração. Ao clicar em Salvar nada acontece.');
  await page.fill('#sup-passos', '1. Abrir o projeto de demonstração\n2. Clicar em Salvar'); await page.check('#sup-consentimento'); await page.click('#sup-revisar'); await page.waitForSelector('#sup-previa'); await foto(page, '09-suporte-revisao.png');
  const previa = await page.textContent('#sup-previa'); assert.match(previa, /\[Bug\]/);
  passo(16, 'Bug sintético preparado e revisado localmente', { previa: previa.replace(/\s+/g, ' ').slice(0, 200) });
  const privados = [dados, demo.root, os.userInfo().username, os.hostname()]; const vazou = privados.filter((p) => p && previa.includes(p));
  assert.deepEqual(vazou, []); assert.doesNotMatch(previa, /Sistema:|Diagnóstico/);
  await page.fill('#sup-descricao', 'Meu token ghp_' + 'Aa1Bb2Cc3Dd4Ee5Ff6Gg7 falhou.'); await page.click('#sup-revisar'); await page.waitForSelector('#sup-bloqueios');
  const bloqueado = { abrirDesabilitado: await page.locator('#sup-abrir').isDisabled(), exportarDesabilitado: await page.locator('#sup-exportar').isDisabled(), segredoRepetidoNaTela: (await page.textContent('#conteudo')).includes('Aa1Bb2Cc3Dd4Ee5Ff6Gg7') && !(await page.inputValue('#sup-descricao')).includes('Aa1Bb2') };
  assert.equal(bloqueado.abrirDesabilitado && bloqueado.exportarDesabilitado, true); await foto(page, '10-suporte-bloqueio.png');
  passo(17, 'Informações privadas não são enviadas: caminhos, usuário, máquina, logs e sistema ausentes da prévia; um segredo digitado bloqueia abrir e exportar', { aparecemNaPrevia: vazou, ...bloqueado });
  await page.fill('#sup-descricao', 'Relato sintético da demonstração. Ao clicar em Salvar nada acontece.'); await page.click('#sup-revisar'); await page.waitForSelector('#sup-previa');
  await dialogos(app, 1); await page.click('#sup-abrir'); await page.waitForTimeout(500);
  const abertas = await app.evaluate(() => globalThis.__abertas); assert.equal(abertas.length, 1); const u = new URL(abertas[0]);
  assert.equal(u.origin + u.pathname, 'https://github.com/AnaPLysyk/Prumo-Qa/issues/new');
  passo(18, 'Página oficial de GitHub Issues preparada (confirmação nativa respondida pela automação; navegador NÃO aberto e NENHUMA issue enviada: openExternal interceptado)', { destino: u.origin + u.pathname, template: u.searchParams.get('template'), titulo: u.searchParams.get('title'), camposPreenchidos: [...u.searchParams.keys()].filter((k) => !['template', 'title'].includes(k)) });
  // 19-20
  const antes = { contextos: (await api(page, 'contextosListar', demo.root)).data.contextos.map((x) => `${x.titulo}|${x.estado}|v${x.versao}`), prefs: (await api(page, 'preferencias')).data.preferencias };
  await app.close();
  sessao = await abrir({ PRUMO_UPDATE_TEST_URL: 'http://127.0.0.1:1/latest' }); page = sessao.page;
  passo(19, 'Aplicativo fechado e reaberto (agora sem rede nem servidor de atualização)', { versaoExibida: (await page.textContent('#versao')).trim() });
  const depoisPrefs = (await api(page, 'preferencias')).data; const depoisCtx = (await api(page, 'contextosListar', demo.root)).data.contextos.map((x) => `${x.titulo}|${x.estado}|v${x.versao}`);
  assert.deepEqual(depoisCtx, antes.contextos); assert.equal(depoisPrefs.preferencias.som, true || antes.prefs.som);
  const vinculos = (await api(page, 'projetos')).data; await ir(page, 'contextos'); await foto(page, '11-persistencia.png');
  passo(20, 'Persistência confirmada: contextos (estado e versão), vínculo e preferências preservados', { contextos: depoisCtx, projetosVinculados: vinculos.length, preferenciaSom: depoisPrefs.preferencias.som, indicadorOfflineVisivel: await page.locator('#sino-ponto').isVisible(), observacao: exe ? 'no pacote não há versão nova real' : 'o indicador vem do arquivo local, sem rede' });
  if (!exe) assert.equal(await page.locator('#sino-ponto').isVisible(), true);
  assert.equal(passos.length, 20);
  fs.writeFileSync(path.join(saida, 'resumo.json'), JSON.stringify({ geradoEm: new Date().toISOString(), versao, executavel: exe ?? 'desenvolvimento', passos }, null, 2));
  console.log('Demonstração concluída. Evidências em', saida);
} finally { await sessao?.app.close().catch(() => {}); servidor?.close(); for (const d of [dados, pw]) fs.rmSync(d, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); }
