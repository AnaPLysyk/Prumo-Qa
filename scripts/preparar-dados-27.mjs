// Executado no runner Windows descartável, com a 2.7 publicada realmente instalada.
// Não consulta serviços, não fabrica credenciais nem aprovação humana. O contexto nasce RASCUNHO.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const instalacao = process.argv[2]; if (!instalacao) throw new Error('Informe a instalação 2.7 do runner');
const app = path.join(instalacao, 'resources', 'app'); assert.equal(JSON.parse(fs.readFileSync(path.join(app, 'package.json'))).version, '2.7.0');
delete process.env.PRUMO_DATA_DIR;
const antigo = (n) => import(pathToFileURL(path.join(app, 'dist', n + '.js')).href);
const { diretorioDados } = await antigo('atividades'); const { carregarProjeto } = await antigo('projeto'); const ctx = await antigo('contextos'); const prefs = await antigo('preferencias'); const esp = await antigo('espacos');
const espaco = await esp.criarEspaco({ nome: 'MIGRACAO-27', descricao: 'Projeto sintético criado pela 2.7 instalada' });
const p = await carregarProjeto(espaco.raizContextos);
const contexto = ctx.criarContexto(p, { tipo: 'requisito', titulo: 'Migração 2.7 sintética', texto: 'Regra fictícia preservada na atualização para a 2.8.', origem: { tipo: 'documento', referencia: 'laboratorio/migracao-2.7' } }, 'RUNNER_FIXTURE');
assert.equal(contexto.estado, 'RASCUNHO'); prefs.alterarPreferencias({ som: false, silenciar: true, verificarAoIniciar: false });
const client = new Client({ name: 'sdk-migracao-2.7', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: path.join(instalacao, 'Prumo QA.exe'), args: [path.join(app, 'dist', 'mcp.js'), espaco.raizContextos], env: { ELECTRON_RUN_AS_NODE: '1' } }));
try { assert.equal(client.getServerVersion().version, '2.7.0'); for (const name of ['contexto_projeto', 'consultar_evidencias']) assert.ok(!(await client.callTool({ name, arguments: {} })).isError); } finally { await client.close(); }
const dados = diretorioDados();
const snapshot = { versao: '2.7.0', espaco: { id: espaco.id, nome: espaco.nome, raizContextos: espaco.raizContextos }, contexto: { id: contexto.id, hash: contexto.hash, estado: contexto.estado, versao: contexto.versao }, preferencias: prefs.lerPreferencias() };
fs.writeFileSync(path.join(dados, 'instantaneo-2.7.0.json'), JSON.stringify(snapshot, null, 2));
console.log('Snapshot 2.7 criado no runner: projeto Prumo, contexto RASCUNHO, preferências e MCP real.');
