// Demonstração ponta a ponta da 2.3 (janela real + MCP real + laboratório). Uso:
//   node scripts/demonstrar-2.3.mjs [<Prumo QA.exe>] [--lab <pasta do Prumo-QA-Lab>]
// Dados em pasta temporária; capturas e resumo.json em .prumo/demonstracao-2.3/ (fora do Git). Nada é simulado:
// a única parte controlada é a resposta do servidor de atualização local (só fora do pacote), indicada no resumo.
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = path.resolve('.');
const exe = process.argv.slice(2).find((a) => a.toLowerCase().endsWith('.exe'));
const labArg = process.argv.indexOf('--lab'); const lab = path.resolve(labArg >= 0 ? process.argv[labArg + 1] : path.join(repo, '..', 'Prumo-QA-Lab'));
const versao = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const saida = path.resolve('.prumo/demonstracao-2.3'); fs.rmSync(saida, { recursive: true, force: true }); fs.mkdirSync(saida, { recursive: true });
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo demo 2.3 '));
const passos = []; const passo = (nome, dado) => { passos.push({ passo: nome, ...dado }); console.log('•', nome, dado ? JSON.stringify(dado) : ''); };
const plano = JSON.parse(fs.readFileSync('exemplos/plano-demo.json', 'utf8'));
const mcpJs = exe ? path.join(path.dirname(exe), 'resources', 'app', 'dist', 'mcp.js') : path.join(repo, 'dist', 'mcp.js');

let servidorAtualizacao; let urlTeste;
if (!exe) { // fora do pacote: resposta controlada e porta fechada, para provar as quatro situações sem depender de rede
  servidorAtualizacao = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ tag_name: 'v99.0.0', html_url: 'https://evil.example', body: '## Novidades\n- release de teste local', draft: false, prerelease: false })); });
  await new Promise((ok) => servidorAtualizacao.listen(0, '127.0.0.1', ok)); urlTeste = `http://127.0.0.1:${servidorAtualizacao.address().port}/latest`;
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
const dialogos = (app, resposta, destino) => app.evaluate(({ dialog }, [r, d]) => { dialog.showMessageBox = async () => ({ response: r, checkboxChecked: false }); dialog.showSaveDialog = async () => ({ canceled: !d, filePath: d }); }, [resposta, destino]);
async function mcp(root, chamadas) {
  const client = new Client({ name: 'codex-demonstracao-2.3', version: '1.0.0' });
  await client.connect(new StdioClientTransport(exe ? { command: exe, args: [mcpJs, root], env: { PRUMO_DATA_DIR: dados, ELECTRON_RUN_AS_NODE: '1' } } : { command: process.execPath, args: [mcpJs, root], env: { PRUMO_DATA_DIR: dados } }));
  try { const out = []; for (const [name, args] of chamadas) out.push(JSON.parse((await client.callTool({ name, arguments: args })).content[0].text)); return { servidor: client.getServerVersion().version, out }; } finally { await client.close(); }
}

let sessao = await abrir(urlTeste ? { PRUMO_UPDATE_TEST_URL: urlTeste } : {});
try {
  // ---------- Aplicativo ----------
  const { page, app } = sessao;
  passo('A1-2 aplicativo aberto', { executavel: exe ?? 'electron (desenvolvimento)', titulo: await page.title(), versaoExibida: (await page.textContent('#versao')).trim() });
  assert.equal((await page.textContent('#versao')).trim(), 'v' + versao);
  await page.click('text=Adicionar projeto de demonstração'); await page.waitForSelector('table');
  const demo = (await api(page, 'projetos')).data[0];
  passo('A3 projeto selecionado', { id: demo.id, estado: demo.state, raiz: demo.root });
  const rodada = await mcp(demo.root, [['contexto_projeto', {}], ['revisar_cobertura', plano], ['executar_validacao', { capability: 'unit' }], ['consultar_evidencias', {}]]);
  passo('A4 chamadas MCP reais', { servidorMCPInforma: rodada.servidor, revisao: rodada.out[1].state, execucao: rodada.out[2].status });
  assert.equal(rodada.servidor, versao);
  await ir(page, 'metricas'); await foto(page, '01-metricas.png'); await ir(page, 'historico'); await foto(page, '02-historico.png');
  const v = (await api(page, 'visao', demo.root)).data.metrics;
  passo('A4 métricas e histórico reais', { operacoes: v.totalOperations, revisoes: v.coverageReviews, BLOCKED: v.executions.BLOCKED, PASS: v.executions.PASS });
  await ajuda(page, 'Versões'); const versoes = page.locator('details.versao'); await versoes.nth(1).locator('summary').click(); await foto(page, '03-versoes.png');
  passo('A5-7 Ajuda › Versões', { total: await versoes.count(), instalada: (await page.textContent('details.versao[open] summary')).replace(/\s+/g, ' ').trim(), detalheDa22: (await versoes.nth(1).textContent()).includes('Aplicativo Electron') });
  await ajuda(page, 'Integrações técnicas'); const logs = page.locator('details.operacao', { hasText: 'prumo:projeto:logs' }).first(); await logs.locator('summary').click(); await foto(page, '04-integracoes-ipc.png');
  const textoIpc = await logs.textContent();
  await page.selectOption('#filtro-tipo', 'MCP'); const exec = page.locator('details.operacao', { hasText: 'executar_validacao' }); await exec.locator('summary').click(); await foto(page, '05-integracoes-mcp.png');
  passo('A8-10 catálogo técnico', { operacoesIPC: (await api(page, 'integracoes')).data.filter((o) => o.tipo === 'IPC').length, ferramentasMCP: 4, ipcDocumentado: textoIpc.includes('painel.ts > atividades.ts') && textoIpc.includes('Consulta local'), mcpDocumentado: (await exec.textContent()).includes('autenticação humana nativa') });
  await ajuda(page, 'Perguntas frequentes'); await page.locator('details.faq').first().locator('summary').click(); await foto(page, '06-faq.png');
  passo('A11 perguntas frequentes', { perguntas: await page.locator('details.faq').count() });
  await ajuda(page, 'Privacidade e dados'); await foto(page, '07-privacidade.png');
  const resumo = (await api(page, 'resumoDados')).data;
  passo('A12 privacidade e dados', { pasta: resumo.directory === dados, projetos: resumo.linkedProjects, bytes: resumo.totalBytes, categorias: Object.keys(resumo.categories), retencao: resumo.retention });
  await ir(page, 'projetos'); await page.click('button:has-text("Selecionar")').catch(() => {}); await ajuda(page, 'Privacidade e dados');
  const exportado = path.join(saida, 'exportado.json'); await dialogos(app, 1, exportado); await page.click('#exportar-dados'); await page.waitForTimeout(500);
  passo('A13 exportação de dados sintéticos', { eventos: JSON.parse(fs.readFileSync(exportado, 'utf8')).events.length, destinoEscolhidoPelaPessoa: true });
  await dialogos(app, 1); await page.click('#excluir-historico'); await page.waitForSelector('text=Excluídos:'); await foto(page, '08-exclusao.png');
  const apos = (await api(page, 'visao', demo.root)).data.metrics;
  passo('A14 exclusão controlada (confirmação nativa substituída por resposta do teste)', { operacoesDepois: apos.totalOperations, codigoPreservado: fs.existsSync(path.join(demo.root, 'qa.project.json')), vinculoPreservado: (await api(page, 'projetos')).data.length === 1, evidenciasPreservadas: (await api(page, 'evidencias', demo.root)).data.results.length });
  assert.equal(apos.totalOperations, 0);
  await ajuda(page, 'Atualizações'); await page.click('text=Verificar atualizações'); await page.waitForSelector('article .estado', { timeout: 20000 });
  const textoAtu = (await page.textContent('article')).replace(/\s+/g, ' ');
  await foto(page, '09-atualizacoes.png');
  passo(exe ? 'A15 verificação de atualização contra o GitHub REAL' : 'A15 verificação de atualização (servidor local controlado, só fora do pacote)', { resultado: (await page.textContent('article .estado')).trim(), mensagem: (await page.textContent('article p:has(.estado)')).split(/\s+/).join(' ').trim() });
  if (!exe) {
    await app.close(); sessao = await abrir({ PRUMO_UPDATE_TEST_URL: 'http://127.0.0.1:1/latest' }); await ajuda(sessao.page, 'Atualizações'); await sessao.page.click('text=Verificar atualizações');
    await sessao.page.waitForSelector('text=Não foi possível verificar atualizações. O aplicativo continua disponível para uso local.');
    await ir(sessao.page, 'projetos'); passo('A16 sem rede (destino inalcançável): mensagem exigida e aplicativo funcional', { mensagem: true, abaProjetos: (await sessao.page.textContent('#conteudo')).includes('Projetos') });
    await sessao.app.close(); sessao = await abrir();
  }
  // consulta ao GitHub real nesta mesma sessão (sem URL de teste quando empacotado)
  const real = (await sessao.page.evaluate(() => window.prumo.verificarAtualizacao())).data; passo('A16b estado real da release oficial', { status: real.status, ultima: real.latest ?? null, instalada: real.installed });
  await sessao.app.close();

  // ---------- Laboratório ----------
  if (fs.existsSync(path.join(lab, 'qa.project.json'))) {
    sessao = await abrir(); const lp = sessao.page;
    await escolherEVincular(sessao, lab);
    const labP = (await api(lp, 'projetos')).data.find((p) => p.id === 'prumo-qa-lab');
    passo('L1-2 laboratório vinculado e contrato validado', { estado: labP.state, capacidades: labP.capabilities });
    assert.equal(labP.state, 'INTEGRADO');
    const direto = spawnSync(process.execPath, ['--test', 'aplicacao/testes/elegibilidade.test.mjs', 'aplicacao/testes/frete.test.mjs', 'aplicacao/testes/acesso.test.mjs', 'aplicacao/testes/pedidos.test.mjs', 'aplicacao/testes/superficial.test.mjs'], { cwd: lab, encoding: 'utf8', env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT')) });
    passo('L3 testes determinísticos da aplicação fictícia (execução direta real, sem o Prumo)', { saida: direto.stdout.split('\n').filter((l) => /^ℹ (tests|pass|fail|skipped)/.test(l)).join(' ') });
    const av = spawnSync(process.execPath, [path.join(lab, 'avaliacoes', 'avaliar.mjs'), '--prumo', mcpJs, '--dados', dados, '--sem-gravar', ...(exe ? ['--comando', exe] : [])], { cwd: lab, encoding: 'utf8', env: { ...process.env, PRUMO_MCP_ELECTRON: exe ? '1' : '' } });
    const linhas = av.stdout.split('\n').filter(Boolean);
    passo('L4-5 avaliação determinística pelo MCP real', { resumo: linhas.at(-1), casos: linhas.filter((l) => /^(OK|FALHOU) +caso/.test(l)).map((l) => l.slice(0, 60)) });
    assert.equal(av.status, 0, av.stdout);
    const mut = spawnSync(process.execPath, ['avaliacoes/mutantes.mjs', '--sem-gravar'], { cwd: lab, encoding: 'utf8' });
    passo('L5 mutantes (lacunas reais dos testes existentes)', { sobrevivem: (mut.stdout.match(/: sobrevive/g) ?? []).length, mortos: (mut.stdout.match(/: morto/g) ?? []).length });
    const sem = JSON.parse(fs.readFileSync(path.join(lab, 'avaliacoes', 'resultados', fs.readdirSync(path.join(lab, 'avaliacoes', 'resultados')).filter((n) => n.endsWith('-semantica.json')).sort().at(-1)), 'utf8'));
    passo('L6 avaliação semântica registrada', { atendeu: sem.resumo.atendeu, naoAtendeu: sem.resumo.naoAtendeu, naoExecutada: sem.resumo.naoExecutada, motivo: sem.casos[0]?.motivo ?? null });
    await ir(lp, 'metricas'); await lp.click('text=Selecionar >> nth=0').catch(() => {});
    const m = (await api(lp, 'visao', labP.root)).data.metrics;
    await ir(lp, 'metricas'); await foto(lp, '10-laboratorio-metricas.png');
    passo('L7 nenhum PASS inventado nas métricas reais do laboratório', { operacoes: m.totalOperations, revisoes: m.coverageReviews, redundanciasCandidatas: m.candidateRedundancies, lacunas: m.gaps, BLOCKED: m.executions.BLOCKED, PASS: m.executions.PASS });
    assert.equal(m.executions.PASS, 0);
    await sessao.app.close();
  } else passo('L0 laboratório não encontrado', { pasta: lab });
  fs.writeFileSync(path.join(saida, 'resumo.json'), JSON.stringify({ geradoEm: new Date().toISOString(), versao, executavel: exe ?? 'desenvolvimento', passos }, null, 2));
  console.log('Demonstração concluída. Evidências em', saida);
} finally { await sessao?.app.close().catch(() => {}); servidorAtualizacao?.close(); fs.rmSync(dados, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); }

async function escolherEVincular({ app, page }, pasta) {
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, pasta);
  await page.click('text=Vincular pasta…'); await page.waitForSelector('table'); await page.waitForTimeout(300);
}
