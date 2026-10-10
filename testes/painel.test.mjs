import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fixture } from './fixtures.mjs';
import { carregarProjeto } from '../dist/projeto.js';
import { iniciarAtividade } from '../dist/atividades.js';
import { salvarEvidencia } from '../dist/evidencias.js';
import * as vinculos from '../dist/vinculos.js';
import * as painel from '../dist/painel.js';

const demo = path.resolve('exemplos/projeto-demo');
const registrar = async (root, tool, resultado, entrada = {}) => {
  const p = await carregarProjeto(root);
  iniciarAtividade(p, tool, { origin: 'MCP', client: 'test-client' }, entrada).finalizar(resultado);
};

test('vinculos: projeto integrado, sem manifesto, manifesto inválido e pasta ausente', async (t) => {
  const f = await fixture(t);
  assert.equal((await vinculos.situacaoProjeto(f.root)).state, 'INTEGRADO');
  const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo sem manifesto '));
  t.after(() => fs.rmSync(vazia, { recursive: true, force: true }));
  const sem = await vinculos.situacaoProjeto(vazia);
  assert.equal(sem.state, 'SEM_MANIFESTO'); assert.match(sem.instructions, /qa\.project\.json/);
  assert.deepEqual(fs.readdirSync(vazia), [], 'diagnóstico não escreve na pasta do projeto');
  fs.writeFileSync(path.join(vazia, 'qa.project.json'), '{"schemaVersion":1}');
  assert.equal((await vinculos.situacaoProjeto(vazia)).state, 'MANIFESTO_INVALIDO');
  assert.equal((await vinculos.situacaoProjeto(path.join(vazia, 'nao-existe'))).state, 'PASTA_AUSENTE');
  assert.equal((await vinculos.situacaoProjeto('relativo/x')).state, 'PASTA_AUSENTE');
});

test('vinculos: só vincula contrato válido, persiste, não duplica e desvincular preserva arquivos', async (t) => {
  const f = await fixture(t);
  const vazia = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo sem manifesto '));
  t.after(() => fs.rmSync(vazia, { recursive: true, force: true }));
  assert.equal((await painel.vincular(vazia)).linked, false);
  assert.equal((await painel.vincular(f.root)).linked, true);
  assert.equal((await painel.vincular(f.root)).linked, true);
  const lista = await painel.projetos();
  assert.equal(lista.length, 1); assert.equal(lista[0].state, 'INTEGRADO'); assert.equal(lista[0].id, 'fixture');
  assert.equal(painel.desvincular(f.root).removed, true);
  assert.ok(fs.existsSync(path.join(f.root, 'qa.project.json')));
  assert.equal((await painel.projetos()).length, 0);
});

test('vinculos: projeto removido do disco aparece como PASTA_AUSENTE, não some em silêncio', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  fs.rmSync(f.root, { recursive: true, force: true });
  assert.equal((await painel.projetos())[0].state, 'PASTA_AUSENTE');
  painel.desvincular(f.root);
});

test('painel recusa raiz não vinculada, inclusive caminho válido e traversal', async (t) => {
  const f = await fixture(t);
  for (const chamada of [() => painel.visao(f.root), () => painel.logs(f.root), () => painel.historico(f.root), () => painel.evidencias(f.root), () => painel.conexoes(f.root), () => painel.exportarLogs(f.root), () => painel.visao(path.join(f.root, '..'))])
    await assert.rejects(chamada, /PROJECT_NOT_LINKED/);
});

test('sem registros: métricas zeradas e vazias, sem inventar tokens ou custos', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  const v = await painel.visao(f.root);
  assert.equal(v.metrics.totalOperations, 0); assert.equal(v.metrics.lastActivity, null); assert.equal(v.metrics.averageDurationMs, null);
  assert.equal(v.metrics.tokens, null); assert.equal(v.metrics.cost, null); assert.equal(v.metrics.appliedChanges, null);
  assert.equal((await painel.logs(f.root)).events.length, 0);
  assert.equal((await painel.historico(f.root)).activities.length, 0);
  const e = await painel.evidencias(f.root); assert.equal(e.status, 'NOT_RUN'); assert.equal(e.results.length, 0);
});

test('métricas, logs e histórico vêm de operações reais e filtram por ferramenta, estado e período', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  const antes = new Date(Date.now() - 1000).toISOString();
  await registrar(f.root, 'contexto_projeto', { state: 'NOT_VERIFIED' });
  await registrar(f.root, 'revisar_cobertura', { state: 'NOT_VERIFIED', findings: [{ type: 'MISSING_ORACLE', recommendation: 'x' }, { type: 'POTENTIAL_REDUNDANCY', recommendation: 'y' }] }, { requirement: 'R1', source: 'README.md', candidates: [{}, {}] });
  await registrar(f.root, 'executar_validacao', { status: 'BLOCKED', reason: 'HUMAN_APPROVAL_REQUIRED: sem aprovação' });
  const v = await painel.visao(f.root);
  assert.equal(v.metrics.totalOperations, 3); assert.equal(v.metrics.mcpCalls, 3); assert.equal(v.metrics.coverageReviews, 1);
  assert.equal(v.metrics.findings, 2); assert.equal(v.metrics.gaps, 1); assert.equal(v.metrics.candidateRedundancies, 1); assert.equal(v.metrics.executions.BLOCKED, 1);
  assert.equal(v.metrics.executions.PASS, 0);
  const todos = await painel.logs(f.root);
  assert.equal(todos.events.length, 6, 'início e término de cada operação');
  assert.equal((await painel.logs(f.root, { tool: 'revisar_cobertura' })).events.length, 2);
  assert.equal((await painel.logs(f.root, { state: 'BLOCKED' })).events.length, 1);
  assert.equal((await painel.logs(f.root, { since: new Date(Date.now() + 60000).toISOString() })).events.length, 0);
  assert.equal((await painel.logs(f.root, { since: antes })).events.length, 6);
  assert.equal((await painel.logs(f.root, { limit: 2 })).events.length, 2);
  const h = await painel.historico(f.root);
  assert.equal(h.activities.length, 3); assert.match(h.notice, /não observa/);
  const revisao = h.activities.find((a) => a.tool === 'revisar_cobertura');
  assert.match(revisao.findingsText, /oráculo/i);
  await assert.rejects(painel.logs(f.root, { limit: 0 }));
  await assert.rejects(painel.logs(f.root, { tool: 'rm -rf' }));
  await assert.rejects(painel.logs(f.root, { extra: 1 }));
});

test('início de operação concluída é STARTED nos logs; só operação sem término vira SEM_TERMINO_OBSERVADO', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  await registrar(f.root, 'contexto_projeto', { state: 'NOT_VERIFIED' });
  iniciarAtividade(await carregarProjeto(f.root), 'revisar_cobertura', { origin: 'MCP', client: 'codex' }); // nunca finalizada
  const logs = await painel.logs(f.root);
  assert.deepEqual(logs.events.map((e) => e.state).sort(), ['NOT_VERIFIED', 'STARTED', 'STARTED']);
  const h = (await painel.historico(f.root)).activities;
  assert.deepEqual(h.map((a) => a.state).sort(), ['NOT_VERIFIED', 'SEM_TERMINO_OBSERVADO']);
  assert.equal((await painel.visao(f.root)).metrics.unfinished, 1);
});

test('filtragem por projeto: histórico de um projeto nunca aparece em outro', async (t) => {
  const a = await fixture(t); const b = await fixture(t, { id: 'outro', name: 'Outro' });
  await painel.vincular(a.root); await painel.vincular(b.root);
  await registrar(a.root, 'contexto_projeto', { state: 'NOT_VERIFIED' });
  assert.equal((await painel.visao(a.root)).metrics.totalOperations, 1);
  assert.equal((await painel.visao(b.root)).metrics.totalOperations, 0);
  assert.equal((await painel.logs(b.root)).events.length, 0);
});

test('registro corrompido torna o histórico parcial e é sinalizado, não escondido', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  await registrar(f.root, 'contexto_projeto', { state: 'NOT_VERIFIED' });
  const pasta = (await painel.visao(f.root)).directory;
  fs.writeFileSync(path.join(pasta, '11111111-1111-1111-1111-111111111111.jsonl'), '{lixo\n');
  const v = await painel.visao(f.root);
  assert.equal(v.metrics.complete, false); assert.equal(v.metrics.problems.length, 1); assert.equal(v.metrics.totalOperations, 1);
  assert.equal((await painel.logs(f.root)).complete, false);
});

test('logs não carregam texto livre nem segredos do requisito; exportação usa só o esquema', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  await registrar(f.root, 'revisar_cobertura', { state: 'NOT_VERIFIED', findings: [] }, { requirement: 'token=ghp_SEGREDOSEGREDOSEGREDO1234 senha', source: 'x', candidates: [] });
  const bruto = await painel.exportarLogs(f.root);
  assert.doesNotMatch(bruto, /ghp_|SEGREDO|senha/);
  assert.ok(JSON.parse(bruto).events.length === 2);
  assert.doesNotMatch(JSON.stringify(await painel.logs(f.root)), /ghp_|SEGREDO/);
});

test('evidências: leitura de resultado sintético preserva PASS/FAIL/BLOCKED/NOT_RUN e distingue rodada de caso', async (t) => {
  const f = await fixture(t, { execution: { requireApproval: true, blockedByDefault: [], environment: 'host', readOnly: false, envAllowlist: [], timeoutMs: 3000, maxOutputBytes: 4096 } });
  await painel.vincular(f.root);
  const p = await carregarProjeto(f.root);
  const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;
  for (const [n, status] of [[1, 'PASS'], [2, 'FAIL'], [3, 'BLOCKED'], [4, 'NOT_RUN']]) {
    const stdout = n === 2 ? 'Authorization: Bearer abc.def.ghi' : 'saída';
    const { hash } = await import('../dist/projeto.js');
    await salvarEvidencia(p, { kind: 'execution_evidence', jobId: id(n), projectId: p.manifesto.id, rootHash: hash(p.raiz), manifestHash: p.manifestoHash, scopeHash: null, capability: 'unit', status,
      reason: 'fixture sintética de teste', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), executed: status !== 'NOT_RUN', exitCode: status === 'FAIL' ? 1 : status === 'PASS' ? 0 : null,
      command: {}, approval: null, cases: [], stdout, stderr: '', logSha256: hash(stdout + '\n'), resultArtifact: null, evidenceScope: 'round', provenance: 'local-process' });
  }
  const r = await painel.evidencias(f.root);
  assert.deepEqual(r.results.map((x) => x.status).sort(), ['BLOCKED', 'FAIL', 'NOT_RUN', 'PASS']);
  assert.ok(r.results.every((x) => x.evidenceScope === 'round' && x.cases.length === 0));
  assert.doesNotMatch(JSON.stringify(r), /abc\.def\.ghi/);
  assert.equal((await painel.evidencias(f.root, id(2))).results.length, 1);
  await assert.rejects(painel.evidencias(f.root, 'nao-e-uuid'));
});

test('conexões: proposta sem alterar nada e com runtime embutido quando empacotado', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  const c = await painel.conexoes(f.root);
  assert.deepEqual(c.map((x) => x.client), ['codex', 'claude']);
  for (const x of c) { assert.match(x.configuration.args[0], /mcp\.js$/); assert.match(x.notice, /Nenhum arquivo foi alterado/); assert.equal(x.configuration.env.ELECTRON_RUN_AS_NODE, undefined); }
});

test('aplicativo empacotado: filho node e proposta de conexão usam o runtime embutido (ELECTRON_RUN_AS_NODE) e nada mais vaza', async (t) => {
  const f = await fixture(t); await painel.vincular(f.root);
  const { ambienteMinimo } = await import('../dist/execucao.js');
  const p = await carregarProjeto(f.root);
  const comando = { executable: 'node', args: ['tests/test.mjs'], cwd: '.', env: {}, requiredFiles: [], requiredEnv: [] };
  process.env.SEGREDO_DO_HOST = 'nao-herdar';
  t.after(() => { delete process.env.SEGREDO_DO_HOST; delete process.versions.electron; });
  assert.equal(ambienteMinimo(p, comando, 'j').ELECTRON_RUN_AS_NODE, undefined);
  Object.defineProperty(process.versions, 'electron', { value: '44.0.0', configurable: true, enumerable: true });
  const env = ambienteMinimo(p, comando, 'j');
  assert.equal(env.ELECTRON_RUN_AS_NODE, '1'); assert.equal(env.SEGREDO_DO_HOST, undefined); assert.equal(env.NODE_OPTIONS, undefined);
  const [codex] = await painel.conexoes(f.root);
  assert.equal(codex.configuration.env.ELECTRON_RUN_AS_NODE, '1');
  assert.ok(codex.command.includes('ELECTRON_RUN_AS_NODE=1'));
});

test('ajuda: todos os documentos existem, trazem versão e declaram limites sem prometer conformidade', () => {
  const docs = painel.ajuda(path.resolve('app/ajuda'), '9.9.9');
  assert.equal(docs.length, painel.documentosAjuda.length);
  const texto = docs.map((d) => d.body).join('\n');
  for (const termo of ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'MCP', 'Privacidade'.toLowerCase(), 'Termos', 'não é assinado', 'rascunho']) assert.match(texto.toLowerCase(), new RegExp(termo.toLowerCase()), termo);
  assert.match(texto, /versão 9\.9\.9/); assert.doesNotMatch(texto, /\{\{/);
  assert.doesNotMatch(texto, /em conformidade com a LGPD|certificad[ao] ISO/i);
});

test('demonstração é copiada para pasta gravável sem sobrescrever e sem .prumo', async (t) => {
  const f = await fixture(t);
  const origem = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo origem demo '));
  t.after(() => fs.rmSync(origem, { recursive: true, force: true }));
  fs.cpSync(demo, origem, { recursive: true });
  fs.mkdirSync(path.join(origem, '.prumo/evidencias'), { recursive: true }); fs.writeFileSync(path.join(origem, '.prumo/evidencias/x.json'), '{}');
  const destino = vinculos.copiarDemonstracao(origem);
  assert.ok(fs.existsSync(path.join(destino, 'qa.project.json'))); assert.ok(!fs.existsSync(path.join(destino, '.prumo')));
  fs.writeFileSync(path.join(destino, 'marca.txt'), 'preservar');
  assert.equal(vinculos.copiarDemonstracao(origem), destino); assert.ok(fs.existsSync(path.join(destino, 'marca.txt')));
  assert.equal((await painel.vincular(destino)).linked, true); void f;
});
