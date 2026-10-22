import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { arquivosDaRodada, arquivosDoCenario, copiarEvidenciaManual, evidenciasDoCenario, pastasDeEvidencia } from '../../../../dist/testes/integracoes/evidenciasDaRun.js';
import { publicar } from '../../../../dist/testes/tipos/escritaQase.js';
import { publicarResultadosNoQase } from '../../../../dist/testes/integracoes/execucoesQase.js';

const JOB = '11111111-1111-4111-8111-111111111111'; const RUN = '22222222-2222-4222-8222-222222222222';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function projeto() {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-evid-')); const p = pastasDeEvidencia(pasta);
  for (const d of [p.evidencias, p.resultados, p.artefatos]) fs.mkdirSync(d, { recursive: true });
  const ev = { kind: 'execution_evidence', jobId: JOB, projectId: 'p', rootHash: 'r', manifestHash: 'm', scopeHash: null, capability: 'e2e-login', status: 'FAIL', reason: 'um cenário falhou', startedAt: '2026-10-22T10:00:00.000Z', endedAt: '2026-10-22T10:00:05.000Z', executed: true, exitCode: 1, command: {}, approval: {}, cases: [{ id: 'login', status: 'FAIL', evidence: 'botão não apareceu' }], stdout: 'rodando login\n', stderr: 'timeout esperando o botão\n', logSha256: 'x', resultArtifact: null, evidenceScope: 'round', provenance: 'local-process' };
  fs.writeFileSync(path.join(p.evidencias, `${JOB}.json`), JSON.stringify({ payload: JSON.stringify(ev), sha256: 'x' }));
  fs.writeFileSync(path.join(p.resultados, `${JOB}.json`), '{"suites":[]}');
  return { pasta, p };
}
const run = { id: RUN }; const caso = { casoId: 7, titulo: 'Login', capability: 'e2e-login', casoRunner: 'login', publicado: false, resultado: { status: 'FAIL', origem: 'EXECUCAO', granularidade: 'CENARIO', evidenciaId: JOB, comentario: '', em: '2026-10-22T10:00:05.000Z' } };

test('a rodada de automação entrega JSON da evidência, log e relatório do runner', () => {
  const { pasta, p } = projeto();
  const nomes = arquivosDaRodada(pasta, JOB, true).map((a) => a.nome);
  assert.deepEqual(nomes, [`${JOB}.json`, `${JOB}.log`, `${JOB}.json`]);
  assert.ok(fs.existsSync(path.join(p.artefatos, `${JOB}.log`)), 'o log foi gravado nas pastas de artefatos');
  assert.match(fs.readFileSync(path.join(p.artefatos, `${JOB}.log`), 'utf8'), /timeout esperando o botão/);
});

test('ao só consultar, o log aparece na lista sem ser gravado', () => {
  const { pasta, p } = projeto();
  assert.ok(arquivosDaRodada(pasta, JOB, false).some((a) => a.nome === `${JOB}.log`));
  assert.equal(fs.existsSync(path.join(p.artefatos, `${JOB}.log`)), false);
});

test('anexo manual: copia o que é aceito, recusa segredo e tipo desconhecido, e vem antes da rodada', () => {
  const { pasta } = projeto(); const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-fora-'));
  const png = path.join(fora, 'tela do erro.png'); const env = path.join(fora, '.env'); const exe = path.join(fora, 'x.exe');
  fs.writeFileSync(png, PNG); fs.writeFileSync(env, 'TOKEN=1'); fs.writeFileSync(exe, 'MZ');
  const r = copiarEvidenciaManual(pasta, RUN, 7, [png, env, exe]);
  assert.deepEqual(r.adicionados, ['tela do erro.png']);
  assert.deepEqual(r.recusados.map((x) => x.nome).sort(), ['.env', 'x.exe']);
  const todos = arquivosDoCenario(pasta, run, caso, false);
  assert.equal(todos[0].origem, 'manual'); assert.ok(todos.slice(1).every((a) => a.origem === 'rodada'));
});

test('no máximo 10 arquivos por cenário', () => {
  const { pasta } = projeto(); const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-fora-')); const origens = [];
  for (let i = 0; i < 12; i++) { const f = path.join(fora, `e${i}.txt`); fs.writeFileSync(f, 'ok ' + i); origens.push(f); }
  const r = copiarEvidenciaManual(pasta, RUN, 7, origens);
  assert.equal(r.adicionados.length, 10); assert.equal(r.recusados.length, 2); assert.ok(r.recusados.every((x) => x.motivo === 'LIMITE_DE_ARQUIVOS'));
  assert.equal(arquivosDoCenario(pasta, run, caso, false).length, 10);
});

test('a tela recebe resumo da rodada, prévia de imagem e texto do log, sem caminhos do disco', () => {
  const { pasta } = projeto(); const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-fora-')); const png = path.join(fora, 'erro.png'); fs.writeFileSync(png, PNG);
  copiarEvidenciaManual(pasta, RUN, 7, [png]);
  const v = evidenciasDoCenario(pasta, run, caso);
  assert.equal(v.rodada.status, 'FAIL'); assert.equal(v.rodada.cenario.evidencia, 'botão não apareceu'); assert.equal(v.rodada.automacao, 'e2e-login');
  assert.match(v.arquivos.find((a) => a.nome === 'erro.png').previa, /^data:image\/png;base64,/);
  assert.match(v.arquivos.find((a) => a.nome === `${JOB}.log`).texto, /timeout/);
  assert.ok(!JSON.stringify(v).includes(pasta), 'nenhum caminho do disco chega à tela');
});

test('sem pasta de evidência ou sem resultado de execução, não há arquivos da rodada', () => {
  const { pasta } = projeto();
  assert.deepEqual(arquivosDoCenario(pasta, run, { ...caso, resultado: { ...caso.resultado, evidenciaId: undefined } }, false), []);
  assert.deepEqual(arquivosDaRodada(pasta, 'nao-e-uuid', true), []);
});

test('o envio sobe cada arquivo uma vez, leva os hashes no cenário e ignora arquivo fora das pastas de evidência', async () => {
  const { pasta, p } = projeto(); const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-fora-')); const intruso = path.join(fora, 'segredo.png'); fs.writeFileSync(intruso, PNG);
  const arquivos = arquivosDaRodada(pasta, JOB, true).map((a) => a.caminho);
  const enviados = []; let seq = 0;
  const ctx = { ler: async (c) => (c.includes('/v1/result/') ? { status: true, result: { entities: [] } } : { status: true, result: {} }),
    enviar: async (metodo, caminho, corpo) => { enviados.push({ metodo, caminho, corpo }); return caminho.includes('/v1/attachment/') ? { status: true, result: [{ hash: String(++seq).padStart(32, 'a') }] } : {}; } };
  const dados = publicar.parse({ runId: 9, resultados: [{ casoId: 7, status: 'failed', comentario: 'botão sumiu', arquivos: [...arquivos, intruso] }, { casoId: 8, status: 'passed', arquivos }] });
  const aux = { arquivosAutorizados: [], raizesDeEvidencia: p.raizes };
  const r = await publicarResultadosNoQase.executar(ctx, { chave: 'PQ' }, dados, 'k1', aux);
  const sobem = enviados.filter((x) => x.caminho.includes('/v1/attachment/')); assert.equal(sobem.length, 3, 'json, log e relatório sobem uma vez cada');
  const lote = JSON.parse(enviados.find((x) => x.caminho.endsWith('/bulk')).corpo).results;
  assert.equal(lote[0].attachments.length, 3); assert.equal(lote[1].attachments.length, 3); assert.deepEqual(lote[0].attachments, lote[1].attachments);
  assert.equal(r.detalhes.arquivosEnviados, 3); assert.equal(r.detalhes.arquivosIgnorados, 1);
  assert.match(publicarResultadosNoQase.resumo(dados), /arquivo\(s\) de evidência/);
});

test('sem as pastas de evidência autorizadas (página, por exemplo), nenhum arquivo é enviado', async () => {
  const { pasta } = projeto(); const arquivos = arquivosDaRodada(pasta, JOB, true).map((a) => a.caminho); const enviados = [];
  const ctx = { ler: async (c) => (c.includes('/v1/result/') ? { status: true, result: { entities: [] } } : { status: true, result: {} }), enviar: async (m, c, corpo) => { enviados.push(c); return {}; } };
  const r = await publicarResultadosNoQase.executar(ctx, { chave: 'PQ' }, publicar.parse({ runId: 9, resultados: [{ casoId: 7, status: 'passed', arquivos }] }), 'k2', { arquivosAutorizados: [], raizesDeEvidencia: [] });
  assert.equal(enviados.filter((c) => c.includes('/v1/attachment/')).length, 0); assert.equal(r.detalhes.arquivosIgnorados, 3);
});
