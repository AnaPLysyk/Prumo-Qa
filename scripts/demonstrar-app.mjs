// Demonstração ponta a ponta do aplicativo (janela real + MCP real). Uso:
//   node scripts/demonstrar-app.mjs                      -> janela em modo desenvolvimento
//   node scripts/demonstrar-app.mjs "C:\...\Prumo QA.exe" -> programa instalado/empacotado
// Dados em pasta temporária; evidências (capturas e resumo.json) em .prumo/demonstracao-app/. Nada é simulado:
// as chamadas MCP e a janela são reais; a execução protegida permanece BLOCKED porque ninguém autentica aqui.
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repo = path.resolve('.');
const exe = process.argv[2];
const saida = path.resolve('.prumo/demonstracao-app'); fs.rmSync(saida, { recursive: true, force: true }); fs.mkdirSync(saida, { recursive: true });
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo demo app '));
const passos = []; const passo = (nome, dado) => { passos.push({ passo: nome, ...dado }); console.log('•', nome, dado ? JSON.stringify(dado) : ''); };
const plano = JSON.parse(fs.readFileSync('exemplos/plano-demo.json', 'utf8'));

async function abrir() {
  const env = { ...process.env, PRUMO_DATA_DIR: dados }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: exe ?? electronPath, args: exe ? [] : [repo], env });
  const page = await app.firstWindow(); await page.waitForSelector('#nav button'); return { app, page };
}
const ir = async (page, aba, arquivo) => { await page.click(`[data-aba=${aba}]`); await page.waitForTimeout(500); if (arquivo) await page.screenshot({ path: path.join(saida, arquivo) }); };
async function mcp(root, chamadas) {
  const client = new Client({ name: 'codex-demonstracao', version: '1.0.0' });
  const transport = exe
    ? new StdioClientTransport({ command: exe, args: [path.join(path.dirname(exe), 'resources', 'app', 'dist', 'mcp.js'), root], env: { PRUMO_DATA_DIR: dados, ELECTRON_RUN_AS_NODE: '1' } })
    : new StdioClientTransport({ command: process.execPath, args: [path.join(repo, 'dist', 'mcp.js'), root], env: { PRUMO_DATA_DIR: dados } });
  await client.connect(transport);
  try { const tools = (await client.listTools()).tools.map((t) => t.name); const respostas = []; for (const [name, args] of chamadas) respostas.push(JSON.parse((await client.callTool({ name, arguments: args })).content[0].text)); return { tools, respostas }; } finally { await client.close(); }
}

let sessao = await abrir();
try {
  passo('1-2 janela aberta', { executavel: exe ?? 'electron (desenvolvimento)', titulo: await sessao.page.title(), versao: (await sessao.page.textContent('#versao')).trim() });
  await sessao.page.click('text=Adicionar projeto de demonstração'); await sessao.page.waitForSelector('table');
  const projeto = (await sessao.page.evaluate(() => window.prumo.projetos())).data[0];
  await ir(sessao.page, 'projetos', '01-projetos.png');
  passo('3-4 projeto de demonstração selecionado', { id: projeto.id, estado: projeto.state, capacidades: projeto.capabilities, raiz: projeto.root });
  await ir(sessao.page, 'metricas', '02-metricas-iniciais.png');
  const m0 = (await sessao.page.evaluate((r) => window.prumo.visao(r), projeto.root)).data.metrics;
  passo('5 métricas iniciais', { operacoes: m0.totalOperations, ultimaAtividade: m0.lastActivity });
  assert.equal(m0.totalOperations, 0);

  const r = await mcp(projeto.root, [['contexto_projeto', {}], ['revisar_cobertura', plano], ['executar_validacao', { capability: 'unit' }], ['consultar_evidencias', {}]]);
  passo('6 chamada MCP real', { tools: r.tools, contexto: r.respostas[0].state, revisao: r.respostas[1].state, achados: r.respostas[1].findings.length, execucao: r.respostas[2].status, motivo: r.respostas[2].reason.split(':')[0] });
  assert.equal(r.respostas[2].status, 'BLOCKED');

  await ir(sessao.page, 'metricas', '03-metricas-apos-mcp.png');
  const v = (await sessao.page.evaluate((x) => window.prumo.visao(x), projeto.root)).data;
  passo('7 registro confirmado', { operacoes: v.metrics.totalOperations, mcp: v.metrics.mcpCalls, revisoes: v.metrics.coverageReviews, achados: v.metrics.findings, lacunas: v.metrics.gaps, redundanciasCandidatas: v.metrics.candidateRedundancies, BLOCKED: v.metrics.executions.BLOCKED, PASS: v.metrics.executions.PASS });
  await ir(sessao.page, 'logs', '04-logs.png'); await ir(sessao.page, 'historico', '05-historico.png');
  const h = (await sessao.page.evaluate((x) => window.prumo.historico(x), projeto.root)).data;
  passo('8-9 histórico, achados e recomendações padronizadas', { atividades: h.activities.length, revisao: h.activities.find((a) => a.tool === 'revisar_cobertura')?.findingsText });
  await ir(sessao.page, 'evidencias', '06-evidencias.png');
  const ev = (await sessao.page.evaluate((x) => window.prumo.evidencias(x), projeto.root)).data;
  passo('9 evidências', { total: ev.results.length, estados: ev.results.map((e) => e.status), arquivo: ev.results[0]?.evidencePath });
  await ir(sessao.page, 'conexoes', '07-conexoes.png'); await ir(sessao.page, 'ajuda', '08-ajuda.png');
  await sessao.app.close(); passo('10 janela fechada');

  const [independente] = (await mcp(projeto.root, [['consultar_evidencias', {}]])).respostas;
  passo('13 sessão MCP independente com a janela fechada', { resultados: independente.results.length });

  sessao = await abrir(); passo('11 aplicativo reaberto');
  await ir(sessao.page, 'metricas', '09-metricas-apos-reabrir.png');
  const v2 = (await sessao.page.evaluate((x) => window.prumo.visao(x), projeto.root)).data;
  passo('12 persistência', { operacoes: v2.metrics.totalOperations, esperado: v.metrics.totalOperations + 1 });
  assert.equal(v2.metrics.totalOperations, v.metrics.totalOperations + 1);
  passo('14 operação protegida segue bloqueada sem aprovação humana', { BLOCKED: v2.metrics.executions.BLOCKED, PASS: v2.metrics.executions.PASS });
  assert.equal(v2.metrics.executions.PASS, 0);
  fs.writeFileSync(path.join(saida, 'resumo.json'), JSON.stringify({ geradoEm: new Date().toISOString(), executavel: exe ?? 'desenvolvimento', passos }, null, 2));
  console.log('Demonstração concluída. Evidências em', saida);
} finally { await sessao.app.close().catch(() => {}); fs.rmSync(dados, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); }
