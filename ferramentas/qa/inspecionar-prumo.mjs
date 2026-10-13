/** Inspeciona o próprio Prumo por CLI e MCP real; nunca solicita nem simula consentimento humano. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo autoinspecao '));
const saida = path.join(raiz, 'tmp/evidencias/refatoracao');
fs.mkdirSync(saida, { recursive: true });
const hook = path.join(raiz, 'testes/conhecimento-hook.cjs');
const relatorio = { inicio: new Date().toISOString(), raiz, cli: [], mcp: {}, aprovacaoHumana: 'NOT_RUN' };
let cliente;
try {
  for (const args of [['doctor'], ['context'], ['run', 'build'], ['evidence']]) {
    const execucao = spawnSync(process.execPath, ['--require', hook, path.join(raiz, 'dist/cli.js'), ...args, '--root', raiz], {
      cwd: raiz, env: { ...process.env, PRUMO_DATA_DIR: dados }, encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024, windowsHide: true
    });
    if (execucao.error) throw execucao.error;
    const resultado = JSON.parse(execucao.stdout);
    relatorio.cli.push({ argumentos: args, codigo: execucao.status, resultado });
    if (args[0] === 'run' ? execucao.status !== 2 || resultado.status !== 'BLOCKED' : execucao.status !== 0) throw new Error('Resultado inesperado: ' + args.join(' '));
  }
  cliente = new Client({ name: 'prumo-autoinspecao', version: '1.0.0' });
  await cliente.connect(new StdioClientTransport({ command: process.execPath, args: ['--require', hook, path.join(raiz, 'dist/mcp.js'), raiz], env: { PRUMO_DATA_DIR: dados } }));
  const tools = (await cliente.listTools()).tools.map((t) => t.name);
  const contexto = await cliente.callTool({ name: 'contexto_projeto', arguments: {} });
  const evidencias = await cliente.callTool({ name: 'consultar_evidencias', arguments: {} });
  if (contexto.isError || evidencias.isError || tools.length !== 8) throw new Error('Contrato MCP inesperado');
  relatorio.mcp = { ferramentas: tools, contexto, evidencias };
  relatorio.estado = 'CONSULTAS_VERIFICADAS_EXECUCAO_BLOQUEADA';
} catch (erro) {
  relatorio.estado = 'FAIL'; relatorio.erro = erro.message; process.exitCode = 1;
} finally {
  await cliente?.close();
  relatorio.termino = new Date().toISOString();
  fs.writeFileSync(path.join(saida, 'autoinspecao.json'), JSON.stringify(relatorio, null, 2));
  fs.rmSync(dados, { recursive: true, force: true });
  console.log(JSON.stringify({ estado: relatorio.estado, cli: relatorio.cli.map(({ argumentos, codigo }) => ({ argumentos, codigo })), mcp: relatorio.mcp.ferramentas, arquivo: path.join(saida, 'autoinspecao.json') }, null, 2));
}
