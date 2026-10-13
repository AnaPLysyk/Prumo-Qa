// Prepara dados REAIS com o Prumo 2.2.0 instalado, para provar que a atualização para a 2.3.0 os preserva.
// Uso: node ferramentas/migracao/preparar-dados-22.mjs "<pasta de instalação do 2.2.0>"   (usa o diretório de dados padrão do usuário)
// Passos: vincula o projeto de demonstração com o código da 2.2.0 e faz chamadas MCP reais ao servidor da 2.2.0
// (rodando no runtime embutido do app instalado). Grava um marcador e um instantâneo em %LOCALAPPDATA%\PrumoQA.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const instalacao = process.argv[2];
if (!instalacao) { console.error('Informe a pasta de instalação do Prumo QA 2.2.0.'); process.exit(2); }
delete process.env.PRUMO_DATA_DIR;
const exe = path.join(instalacao, 'Prumo QA.exe');
const app = path.join(instalacao, 'resources', 'app');
const versaoInstalada = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).version;
assert.equal(versaoInstalada, '2.2.0', 'esta preparação deve usar a versão 2.2.0');
const antigo = (m) => import(pathToFileURL(path.join(app, 'dist', m)).href);

const { copiarDemonstracao, adicionarVinculo } = await antigo('vinculos.js');
const { diretorioDados } = await antigo('atividades.js');
const dados = diretorioDados();
const demo = copiarDemonstracao(path.join(instalacao, 'resources', 'demo'));
const vinculo = await adicionarVinculo(demo);
assert.equal(vinculo.linked, true);

const client = new Client({ name: 'codex-preparacao-2.2', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: exe, args: [path.join(app, 'dist', 'mcp.js'), demo], env: { ELECTRON_RUN_AS_NODE: '1' } }));
const plano = JSON.parse(fs.readFileSync('exemplos/plano-demo.json', 'utf8'));
const chamar = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
try {
  assert.equal((await client.getServerVersion()).version, '2.2.0');
  await chamar('contexto_projeto', {});
  await chamar('revisar_cobertura', plano);
  const exec = await chamar('executar_validacao', { capability: 'unit' });
  assert.equal(exec.status, 'BLOCKED');
} finally { await client.close(); }

fs.writeFileSync(path.join(dados, 'marca-migracao.txt'), 'dados criados pela versão 2.2.0');
const instantaneo = { versao: versaoInstalada, raizDemonstracao: demo, operacoes: 3, evidenciasBloqueadas: 1, dados };
fs.writeFileSync(path.join(dados, 'instantaneo-2.2.0.json'), JSON.stringify(instantaneo, null, 2));
console.log(JSON.stringify(instantaneo));
