import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Apoio comum aos testes da janela (Playwright sobre o Electron real). Não é um teste.
 * Por padrão abre o aplicativo em desenvolvimento; com PRUMO_APP_EXE usa o executável instalado.
 */
export const repo = path.resolve('.');
export const versao = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
export const exe = process.env.PRUMO_APP_EXE;
export const abas = ['projetos', 'contextos', 'tickets', 'testes', 'automacoes', 'execucoes', 'rastreabilidade', 'metricas', 'logs', 'historico', 'evidencias', 'conexoes', 'agentes', 'suporte', 'ajuda'];

// Cada teste tem seu diretório de dados; ao final os aplicativos abertos são fechados ANTES de apagá-lo.
const abertos = new Map();
export const novoDados = (t) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo dados desktop ')); abertos.set(d, []);
  t.after(async () => { for (const fechar of abertos.get(d)) await fechar().catch(() => {}); abertos.delete(d); fs.rmSync(d, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); });
  return d;
};
export async function abrir(t, dados, extra = [], envExtra = {}) {
  // VS Code/Claude definem ELECTRON_RUN_AS_NODE; com ele o Electron viraria Node puro e não abriria janela.
  const env = { ...process.env, ...(dados ? { PRUMO_DATA_DIR: dados } : {}), ...envExtra }; delete env.ELECTRON_RUN_AS_NODE; if (!dados) delete env.PRUMO_DATA_DIR; // sem dados: diretório padrão do usuário
  const app = await electron.launch({ executablePath: exe ?? electronPath, args: exe ? extra : [repo, ...extra], env });
  let fechado = false;
  const fechar = async () => { if (!fechado) { fechado = true; await app.close(); } };
  if (dados) abertos.get(dados).push(fechar);
  const page = await app.firstWindow();
  const erros = []; page.on('pageerror', (e) => erros.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await page.waitForSelector('#nav button');
  return { app, page, erros, fechar };
}
export const ir = async (page, aba) => { await page.click(`[data-aba=${aba}]`); await page.waitForFunction((a) => document.querySelector(`[data-aba=${a}]`)?.getAttribute('aria-current') === 'page', aba); await page.waitForTimeout(150); };
export const escolherPasta = (app, pasta) => app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, pasta);
export async function mcp(root, dados, chamadas) {
  const client = new Client({ name: 'codex-desktop-test', version: '1.0.0' });
  // Instalado: o servidor roda no runtime embutido do aplicativo (sem Node.js na máquina), como configura src/conexoes.ts.
  const transport = exe
    ? new StdioClientTransport({ command: exe, args: [path.join(path.dirname(exe), 'resources', 'app', 'dist', 'mcp.js'), root], env: { ...(dados ? { PRUMO_DATA_DIR: dados } : {}), ELECTRON_RUN_AS_NODE: '1' } })
    : new StdioClientTransport({ command: process.execPath, args: [path.join(repo, 'dist/mcp.js'), root], env: dados ? { PRUMO_DATA_DIR: dados } : {} });
  await client.connect(transport);
  try { const out = []; for (const [name, args] of chamadas) out.push(await client.callTool({ name, arguments: args })); return out; } finally { await client.close(); }
}
/** Abre o app no diretório de dados PADRÃO do usuário (testes de migração do instalador); fecha ao final do teste. */
export async function abrirPadrao(t) {
  const r = await abrir(t, null);
  t.after(() => r.fechar());
  return r;
}
