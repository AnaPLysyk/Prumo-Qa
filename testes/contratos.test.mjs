import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fixture } from './fixtures.mjs';
import { criarServidor } from '../dist/mcp.js';
import { catalogo, esquemasIpc, camposDe, canaisFrequentes } from '../dist/contratos.js';

const ler = (f) => fs.readFileSync(f, 'utf8');
const principal = ler('src/desktop/main.ts');
const preload = ler('app/preload.cjs');
const ipcCatalogo = catalogo().filter((o) => o.tipo === 'IPC');
const mcpCatalogo = catalogo().filter((o) => o.tipo === 'MCP');

test('IPC: canais registrados em main.ts, esquemas e catálogo são exatamente os mesmos', () => {
  const registrados = [...principal.matchAll(/^canal\('([a-z]+:[a-z]+)'/gm)].map((m) => m[1]).sort();
  assert.deepEqual(registrados, Object.keys(esquemasIpc).sort(), 'main.ts × esquemas');
  assert.deepEqual(ipcCatalogo.map((o) => o.nome).sort(), Object.keys(esquemasIpc).map((c) => 'prumo:' + c).sort(), 'catálogo × esquemas');
  assert.equal(new Set(registrados).size, registrados.length, 'sem canal duplicado');
  assert.equal([...principal.matchAll(/ipcMain\.handle\(/g)].length, 1, 'ipcMain.handle só existe dentro do wrapper validado');
});

test('IPC: preload expõe apenas canais do catálogo, cada um uma vez, sem ipcRenderer livre', () => {
  const usados = [...preload.matchAll(/chamar\('([a-z]+:[a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(usados)].sort(), Object.keys(esquemasIpc).sort());
  assert.doesNotMatch(preload, /exposeInMainWorld\([^)]*ipcRenderer|ipcRenderer\s*[,}]\s*\)\)/);
  assert.match(preload, /Object\.freeze/);
  assert.equal([...preload.matchAll(/ipcRenderer\./g)].length, 1, 'ipcRenderer só é usado dentro de chamar()');
});

test('IPC: todo canal tem documentação completa e campos derivados do esquema real', () => {
  for (const o of ipcCatalogo) {
    for (const k of ['finalidade', 'origem', 'destino', 'entrada', 'saida', 'permissoes', 'efeito', 'arquivos', 'registro']) assert.ok(o[k]?.length > 3, `${o.nome}.${k}`);
    assert.ok(o.erros.includes('INVALID_ARGUMENTS') && o.erros.includes('IPC_SENDER_REJECTED'), o.nome);
    assert.ok(o.protecoes.length >= 3, o.nome);
    assert.deepEqual(o.campos, camposDe(esquemasIpc[o.nome.slice(6)]), o.nome);
  }
  assert.deepEqual(ipcCatalogo.find((o) => o.nome === 'prumo:dados:excluir').campos, ['escopo', 'root']);
  assert.deepEqual(ipcCatalogo.find((o) => o.nome === 'prumo:projeto:logs').campos, ['filter', 'root']);
});

test('IPC: esquemas recusam argumentos extras, inválidos e escopos desconhecidos', () => {
  const ok = (c, v) => esquemasIpc[c].safeParse(v).success;
  assert.ok(ok('projeto:visao', { root: 'C:\\x' }));
  assert.ok(!ok('projeto:visao', { root: 'C:\\x', extra: 1 }));
  assert.ok(!ok('projeto:visao', { root: '' }));
  assert.ok(!ok('projeto:visao', { root: 5 }));
  assert.ok(!ok('app:info', { qualquer: 1 }));
  assert.ok(!ok('projeto:logs', { root: 'x', filter: { limit: 0 } }));
  assert.ok(!ok('projeto:evidencias', { root: 'x', jobId: '../../etc' }));
  assert.ok(!ok('conexao:aplicar', { root: 'x', client: 'claude' }));
  assert.ok(ok('dados:excluir', { escopo: 'diagnostico' }));
  assert.ok(!ok('dados:excluir', { escopo: 'historico' }), 'historico exige projeto');
  assert.ok(!ok('dados:excluir', { escopo: 'tudo', root: 'x' }));
  assert.ok(!ok('dados:excluir', { escopo: 'diagnostico', root: 'x' }));
});

test('IPC: exclusão exige confirmação nativa e nunca é alcançável por MCP; consultas frequentes não geram diagnóstico de sucesso', () => {
  assert.match(principal, /canal\('dados:excluir'[\s\S]*?showMessageBox[\s\S]*?response !== 1/);
  assert.match(principal, /canal\('atualizacao:abrir'[\s\S]*?showMessageBox/);
  for (const c of ['projeto:logs', 'projeto:visao', 'projeto:historico']) assert.ok(canaisFrequentes.has(c), c);
  assert.ok(!canaisFrequentes.has('dados:excluir'));
  const mcpFonte = ler('src/mcp.ts');
  assert.doesNotMatch(mcpFonte, /excluir|dados\.js|diagnostico\.js|vinculos\.js/i, 'mcp.ts não importa exclusão nem vínculos');
});

test('MCP: servidor real lista exatamente as quatro ferramentas e o catálogo descreve os mesmos argumentos', async (t) => {
  const f = await fixture(t);
  const servidor = await criarServidor(f.root);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await servidor.connect(b);
  const cliente = new Client({ name: 'teste-contrato', version: '1.0.0' }); await cliente.connect(a);
  t.after(() => cliente.close());
  const ferramentas = (await cliente.listTools()).tools;
  assert.deepEqual(ferramentas.map((x) => x.name).sort(), ['consultar_evidencias', 'contexto_projeto', 'executar_validacao', 'revisar_cobertura']);
  assert.deepEqual(mcpCatalogo.map((o) => o.nome).sort(), ferramentas.map((x) => x.name).sort());
  for (const tool of ferramentas) {
    const doc = mcpCatalogo.find((o) => o.nome === tool.name);
    assert.deepEqual(doc.campos, Object.keys(tool.inputSchema.properties ?? {}).sort(), tool.name);
    for (const k of ['finalidade', 'origem', 'destino', 'entrada', 'saida', 'permissoes', 'efeito', 'arquivos', 'registro']) assert.ok(doc[k]?.length > 3, `${tool.name}.${k}`);
    assert.ok(doc.erros.length > 0 && doc.protecoes.length >= 3);
  }
});

test('catálogo não inventa HTTP: nenhuma URL, porta ou método REST nas descrições', () => {
  const texto = JSON.stringify(catalogo());
  assert.doesNotMatch(texto, /https?:\/\/|localhost|127\.0\.0\.1|\b(GET|POST|PUT|PATCH)\b\s+\/|:\d{4,5}\b/);
});

test('cada módulo citado como destino existe em src/', () => {
  const nomes = new Set(fs.readdirSync('src').map((n) => n.replace(/\.ts$/, '')).concat(fs.readdirSync('src/desktop').map((n) => 'desktop/' + n.replace(/\.ts$/, ''))));
  for (const o of catalogo()) for (const m of o.destino.matchAll(/\b([a-z]+)\.(?:ts|[a-zA-Z]+)/g)) if (nomes.has(m[1])) assert.ok(fs.existsSync(path.join('src', m[1] + '.ts')), `${o.nome}: ${m[1]}`);
});
