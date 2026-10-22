/** Conectar Claude Code, Codex, GitHub Copilot e Gemini CLI ao MCP do Prumo: comando de cada CLI, leitura da configuração e escrita sem sobrescrever. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararConexao, aplicarConexao, clientes } from '../../../../dist/conexoes/ia/conectarIa.js';
import { inspecionarIntegracao, conferirServidores } from '../../../../dist/conexoes/servicoIaDiagnostico.js';

// Pasta pessoal e PATH sintéticos: nenhum CLI real nem configuração real da pessoa é lida ou alterada.
function perfilFalso(t) {
  const raiz = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'prumo ias mcp ')));
  const antes = { ...process.env };
  Object.assign(process.env, { USERPROFILE: raiz, HOME: raiz, LOCALAPPDATA: path.join(raiz, 'local'), CODEX_HOME: path.join(raiz, '.codex'), PATH: path.join(raiz, 'bin'), Path: path.join(raiz, 'bin') });
  t.after(() => { for (const k of ['USERPROFILE', 'HOME', 'LOCALAPPDATA', 'CODEX_HOME', 'PATH', 'Path']) antes[k] === undefined ? delete process.env[k] : (process.env[k] = antes[k]); fs.rmSync(raiz, { recursive: true, force: true }); });
  fs.mkdirSync(path.join(raiz, 'projeto'), { recursive: true });
  return { raiz, projeto: { raiz: path.join(raiz, 'projeto'), manifesto: { id: 'loja-demo' } } };
}
const gravarJson = (arquivo, dados) => { fs.mkdirSync(path.dirname(arquivo), { recursive: true }); fs.writeFileSync(arquivo, JSON.stringify(dados)); };

test('cada IA recebe o "mcp add" do próprio CLI, no escopo do usuário', (t) => {
  const { raiz, projeto } = perfilFalso(t);
  assert.deepEqual([...clientes], ['codex', 'claude', 'copilot', 'gemini']);
  const planos = Object.fromEntries(clientes.map((c) => [c, prepararConexao(projeto, c)]));
  const { command, args } = planos.copilot.configuration; const servidor = [command, ...args]; const nome = planos.copilot.name;
  const env = (opcao) => Object.entries(planos.copilot.configuration.env).flatMap(([k, v]) => [opcao, `${k}=${v}`]);
  assert.deepEqual(planos.codex.args, ['mcp', 'add', nome, ...env('--env'), '--', ...servidor]);
  assert.deepEqual(planos.claude.args, ['mcp', 'add', '--transport', 'stdio', '--scope', 'user', nome, ...env('--env'), '--', ...servidor]);
  assert.deepEqual(planos.copilot.args, ['mcp', 'add', ...env('--env'), nome, '--', ...servidor]);
  assert.deepEqual(planos.gemini.args, ['mcp', 'add', '--scope', 'user', ...env('-e'), nome, ...servidor]);
  assert.equal(planos.copilot.destination, path.join(raiz, '.copilot', 'mcp-config.json'));
  assert.equal(planos.gemini.destination, path.join(raiz, '.gemini', 'settings.json'));
  for (const c of clientes) assert.equal(planos[c].installed, false, c + ' não está no PATH falso');
  assert.throws(() => prepararConexao(projeto, 'chatgpt'), /codex, claude, copilot ou gemini/);
});

test('Copilot (type "local") e Gemini são reconhecidos pelo arquivo de configuração; env estranho ou outro projeto não contam', (t) => {
  const { raiz, projeto } = perfilFalso(t);
  assert.equal(inspecionarIntegracao(projeto, 'copilot').code, 'NOT_CONFIGURED', 'sem arquivo: não configurado, sem erro');
  const plano = prepararConexao(projeto, 'copilot'); const { command, args, env } = plano.configuration;
  // Formatos gravados pelo próprio "copilot mcp add" (1.0) e "gemini mcp add" (0.65).
  gravarJson(path.join(raiz, '.copilot', 'mcp-config.json'), { mcpServers: { [plano.name]: { tools: ['*'], type: 'local', command, args, env } } });
  gravarJson(path.join(raiz, '.gemini', 'settings.json'), { mcpServers: { [plano.name]: { command, args, env } } });
  assert.deepEqual(inspecionarIntegracao(projeto, 'copilot'), { found: true, matches: 1, code: 'CONFIGURATION_MATCH' });
  assert.deepEqual(inspecionarIntegracao(projeto, 'gemini'), { found: true, matches: 1, code: 'CONFIGURATION_MATCH' });
  assert.equal(conferirServidores(plano, [{ type: 'local', command, args, env: { ...env, TOKEN: 'segredo' } }]).found, false, 'env além do esperado é recusado');
  assert.equal(conferirServidores(plano, [{ type: 'local', command, args: [args[0], path.join(raiz, 'outro')], env }]).found, false, 'outro projeto não conta');
  assert.equal(conferirServidores(plano, [{ type: 'http', url: 'https://exemplo.test/mcp' }]).found, false, 'servidor remoto não conta');
  fs.writeFileSync(path.join(raiz, '.gemini', 'settings.json'), '[]');
  assert.equal(inspecionarIntegracao(projeto, 'gemini').code, 'CONNECTION_INSPECTION_FAILED', 'arquivo inválido vira erro, nunca "não configurado"');
});

test('Windows: "Conectar" roda o script do npm pelo Node, sem shell, e não sobrescreve servidor com o mesmo nome', { skip: process.platform !== 'win32' }, (t) => {
  const { raiz, projeto } = perfilFalso(t);
  const bin = path.join(raiz, 'bin'); const script = path.join(bin, 'node_modules', '@google', 'gemini-cli', 'bundle', 'gemini.js');
  fs.mkdirSync(path.dirname(script), { recursive: true }); fs.writeFileSync(path.join(bin, 'gemini.cmd'), '@echo off\r\n');
  const registro = path.join(raiz, 'argv.json');
  fs.writeFileSync(script, `require('node:fs').writeFileSync(${JSON.stringify(registro)}, JSON.stringify(process.argv.slice(2)));`);
  const plano = prepararConexao(projeto, 'gemini');
  assert.equal(plano.installed, true); assert.equal(plano.executable, script); assert.equal(plano.manualOnly, false);
  assert.match(plano.command, /^& 'gemini\.cmd' 'mcp' 'add' '--scope' 'user'/, 'no terminal a pessoa usa o atalho .cmd');
  assert.equal(aplicarConexao(plano, 'sem confirmação').configured, false);
  gravarJson(path.join(raiz, '.gemini', 'settings.json'), { mcpServers: { [plano.name]: { command: 'outro.exe', args: [] } } });
  const preservado = aplicarConexao(plano, plano.confirmation);
  assert.equal(preservado.configured, false); assert.match(preservado.reason, /preservada sem sobrescrita/);
  assert.equal(fs.existsSync(registro), false, 'o CLI nem foi chamado');
  fs.rmSync(path.join(raiz, '.gemini'), { recursive: true });
  assert.equal(aplicarConexao(plano, plano.confirmation).configured, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(registro, 'utf8')), plano.args);
});
