import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fixture } from './fixtures.mjs';
import { criarMundo } from './mundo-servicos.mjs';
import { criarEspaco, pastaEspaco, gravarVinculo, associarEspaco, obterEspaco } from '../dist/espacos.js';
import { habilitarEscrita, executarOperacao } from '../dist/operacoesExternas.js';
import { autorizarExecucao, delegadaPara } from '../dist/autorizacoes.js';
import { executarValidacao } from '../dist/execucao.js';
import { carregarProjeto } from '../dist/projeto.js';
import { prepararRunLocal, criarRunNoQase, executarRunLocal, declararResultadoManual, publicarRunLocal, propostasDeBugs, obterRunLocal, automacaoDoCaso } from '../dist/fluxoQase.js';
import { criarProposta, listarPropostas, revisarProposta, editarProposta, descartarProposta, podePublicar, marcarPublicada, obterProposta, MAX_IA_POR_HORA } from '../dist/propostas.js';

const base = (t) => { const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo fluxo ')); t.after(() => fs.rmSync(b, { recursive: true, force: true })); return b; };
const solicitador = async (esc) => ({ subject: 'pessoa-simulada', method: 'Windows-CredUI-LogonUser', scopeHash: esc.scopeHash, at: new Date().toISOString() });
const runner = (cases, saida = 1) => `import fs from 'node:fs';fs.appendFileSync(new URL('../ran.txt',import.meta.url),'x');fs.writeFileSync(process.env.PRUMO_RESULT_FILE,JSON.stringify({jobId:process.env.PRUMO_JOB_ID,cases:${JSON.stringify(cases)}}));process.exit(${saida});`;

async function cenario(t, { teste, capabilities = { unit: 'node tests/test.mjs' }, autorizar = true } = {}) {
  const b = base(t); const mundo = criarMundo(); const fx = await fixture(t, { commands: capabilities });
  await fx.write('tests/test.mjs', teste ?? runner([{ id: 'C1', status: 'PASS', evidence: 'ok' }, { id: 'C2', status: 'FAIL', evidence: 'valor não persistiu' }]));
  const e = await criarEspaco({ nome: 'SMART-LAB' }, b); await pastaEspaco(e.id, fx.root, b);
  const jv = gravarVinculo(e.id, 'jira', randomUUID(), { ...mundo.recursos.jira }, b).vinculos[0]; const qv = gravarVinculo(e.id, 'qase', randomUUID(), { ...mundo.recursos.qase }, b).vinculos[1];
  for (const s of ['jira', 'qase', 'github']) habilitarEscrita(e.id, s, true, 'pessoa', b);
  const dep = { executor: mundo.executor, base: b }; const rodar = (op, p) => executarOperacao(mundo.executor, e.id, op, p, { base: b, confirmado: true });
  if (autorizar) { for (const cap of Object.keys(capabilities)) await autorizarExecucao(await carregarProjeto(fx.root), e.id, cap, 'teste', { dias: 1, maxUsos: 20 }, b, solicitador); }
  const caso = async (titulo) => { const r = await rodar('qase.criar_caso', { titulo, passos: [{ acao: 'x' }] }); return Number(r.remoto.id); };
  const ligar = (casoId, automacao) => associarEspaco(e.id, { de: { tipo: 'qase', id: String(casoId), vinculoId: qv.id, origem: 'Qase SFQ' }, para: { tipo: 'automacao', id: automacao, origem: 'qa.project.json' }, justificativa: 'Declarado pela pessoa' }, b);
  const execucao = { executar: executarValidacao, modo: 'AGENDADO', delegada: (esp, amb) => delegadaPara(esp, amb, b) };
  return { b, mundo, fx, e, jv, qv, dep, rodar, caso, ligar, execucao, ran: () => (fs.existsSync(path.join(fx.root, 'ran.txt')) ? fs.readFileSync(path.join(fx.root, 'ran.txt'), 'utf8').length : 0) };
}

test('fluxo completo: casos -> run -> execução autorizada -> resultados por cenário e manual -> publicação -> releitura; sem PASS inventado', async (t) => {
  const c = await cenario(t); const [a, bb, cm] = [await c.caso('Editor grava'), await c.caso('Leitor é recusado'), await c.caso('Revisão visual manual')];
  c.ligar(a, 'unit#C1'); c.ligar(bb, 'unit#C2'); assert.deepEqual(automacaoDoCaso(c.e.id, a, c.b), { capability: 'unit', casoRunner: 'C1' }); assert.equal(automacaoDoCaso(c.e.id, cm, c.b), null);
  const run = prepararRunLocal(c.e.id, { titulo: 'Regressão SMART', ambiente: 'teste', casos: [a, bb, cm].map((id, i) => ({ casoId: id, titulo: ['Editor grava', 'Leitor é recusado', 'Revisão visual manual'][i] })) }, c.b);
  assert.equal(run.estado, 'PREPARADA'); assert.deepEqual(run.casos.map((x) => x.capability), ['unit', 'unit', null]); assert.equal(run.runIdRemoto, null);
  const criada = await criarRunNoQase(c.dep, run.id, { confirmado: true }); assert.equal(criada.estado, 'CONFIRMADA'); const r1 = obterRunLocal(run.id, c.b); assert.equal(r1.estado, 'CRIADA'); assert.ok(r1.runIdRemoto); assert.equal(c.mundo.qase.resultados.length, 0, 'run criada não é run executada'); assert.equal(c.ran(), 0);
  const exec = await executarRunLocal(c.dep, run.id, c.execucao); assert.deepEqual(exec.executadas.map((x) => [x.capability, x.status]), [['unit', 'FAIL']]); assert.equal(c.ran(), 1, 'uma execução por automação');
  const r2 = obterRunLocal(run.id, c.b); assert.deepEqual(r2.casos.map((x) => x.resultado?.status ?? null), ['PASS', 'FAIL', null]); assert.ok(r2.casos.slice(0, 2).every((x) => x.resultado.granularidade === 'CENARIO' && x.resultado.origem === 'EXECUCAO' && x.resultado.evidenciaId)); assert.match(r2.casos[1].resultado.comentario, /valor não persistiu/); assert.equal(r2.estado, 'EXECUTADA');
  assert.equal((await publicarRunLocal(c.dep, run.id, { confirmado: true })).publicados, 2); assert.deepEqual(c.mundo.qase.resultados.map((r) => [r.case_id, r.status]), [[a, 'passed'], [bb, 'failed']]);
  const r3 = obterRunLocal(run.id, c.b); assert.equal(r3.estado, 'PARCIAL', 'o caso manual ainda não tem resultado'); assert.equal(r3.confirmadaNoQase, true); assert.equal(r3.casos[2].publicado, false);
  assert.throws(() => declararResultadoManual(run.id, a, { status: 'PASS', comentario: 'forçar' }, 'pessoa', c.b), /RESULT_FROM_EXECUTION/);
  declararResultadoManual(run.id, cm, { status: 'BLOCKED', comentario: 'ambiente de homologação indisponível' }, 'ana', c.b); const pub2 = await publicarRunLocal(c.dep, run.id, { confirmado: true }); assert.equal(pub2.publicados, 1);
  assert.equal(c.mundo.qase.resultados.length, 3); assert.match(c.mundo.qase.resultados[2].comment, /declarado por ana/); assert.equal(obterRunLocal(run.id, c.b).estado, 'PUBLICADA'); assert.equal((await publicarRunLocal(c.dep, run.id, { confirmado: true })).publicados, 0, 'nada pendente'); assert.equal(c.mundo.qase.resultados.length, 3);
  assert.equal(c.mundo.qase.resultados.filter((r) => r.status === 'passed').length, 1, 'só um PASS: o que foi executado de fato');
});

test('mapeamentos e bloqueios: sem mapeamento por cenário nada é inferido; sem autorização tudo fica BLOCKED e nada executa', async (t) => {
  const c = await cenario(t, { teste: runner([{ id: 'X', status: 'PASS', evidence: 'ok' }], 0) }); const [a, bb, cc] = [await c.caso('Caso A'), await c.caso('Caso B'), await c.caso('Caso C')];
  c.ligar(a, 'unit'); c.ligar(bb, 'unit'); c.ligar(cc, 'unit#SUMIU'); const run = prepararRunLocal(c.e.id, { titulo: 'Mapeamento', ambiente: 'teste', casos: [a, bb, cc].map((id) => ({ casoId: id, titulo: 'c' + id })) }, c.b); await criarRunNoQase(c.dep, run.id, { confirmado: true });
  await executarRunLocal(c.dep, run.id, c.execucao); const r = obterRunLocal(run.id, c.b);
  assert.deepEqual(r.casos.map((x) => x.resultado.status), ['NOT_RUN', 'NOT_RUN', 'NOT_RUN']); assert.match(r.casos[0].resultado.comentario, /MAPEAMENTO_AUSENTE/); assert.match(r.casos[2].resultado.comentario, /não foi reportado/);
  assert.equal((await publicarRunLocal(c.dep, run.id, { confirmado: true })).publicados, 0); assert.equal(c.mundo.qase.resultados.length, 0, 'NOT_RUN nunca é publicado');
  const s = await cenario(t, { autorizar: false }); const x = await s.caso('Caso X'); s.ligar(x, 'unit#C1'); const run2 = prepararRunLocal(s.e.id, { titulo: 'Sem autorização', ambiente: 'teste', casos: [{ casoId: x, titulo: 'Caso X' }] }, s.b);
  await executarRunLocal(s.dep, run2.id, s.execucao); const r2 = obterRunLocal(run2.id, s.b); assert.equal(r2.casos[0].resultado.status, 'BLOCKED'); assert.match(r2.casos[0].resultado.comentario, /HUMAN_APPROVAL_REQUIRED/); assert.equal(s.ran(), 0, 'o processo não rodou');
  await assert.rejects(publicarRunLocal(s.dep, run2.id, { confirmado: true }), /RUN_NOT_CREATED/);
});

test('publicação supervisionada agendada: só com política vigente para a run; sem ela os resultados ficam locais', async (t) => {
  const { criarPoliticaEscrita } = await import('../dist/autorizacoes.js'); const c = await cenario(t); const a = await c.caso('Editor grava'); c.ligar(a, 'unit#C1');
  const run = prepararRunLocal(c.e.id, { titulo: 'Agendada', ambiente: 'teste', casos: [{ casoId: a, titulo: 'Editor grava' }] }, c.b); await criarRunNoQase(c.dep, run.id, { confirmado: true }); await executarRunLocal(c.dep, run.id, c.execucao);
  const sem = await publicarRunLocal(c.dep, run.id, { confirmado: false, origem: 'AGENDADO' }); assert.equal(sem.operacao.estado, 'BLOQUEADA'); assert.equal(sem.publicados, 0); assert.equal(c.mundo.qase.resultados.length, 0); assert.equal(obterRunLocal(run.id, c.b).casos[0].publicado, false);
  criarPoliticaEscrita(c.e.id, { operacao: 'qase.publicar_resultados', runs: [obterRunLocal(run.id, c.b).runIdRemoto], dias: 1, maxUsos: 3 }, 'pessoa', c.b);
  const ok = await publicarRunLocal(c.dep, run.id, { confirmado: false, origem: 'AGENDADO' }); assert.equal(ok.publicados, 1); assert.equal(c.mundo.qase.resultados.length, 1);
});

test('falha vira rascunho de bug com ticket de origem; publicar cria o ticket, relaciona e registra o vínculo, sem duplicar', async (t) => {
  const c = await cenario(t); c.mundo.semear('SMART-100'); const a = await c.caso('Leitor é recusado'); c.ligar(a, 'unit#C2');
  associarEspaco(c.e.id, { de: { tipo: 'jira', id: 'SMART-100', vinculoId: c.jv.id, origem: 'Jira' }, para: { tipo: 'qase', id: String(a), vinculoId: c.qv.id, origem: 'Qase SFQ' }, justificativa: 'Declarado' }, c.b);
  const run = prepararRunLocal(c.e.id, { titulo: 'Run com falha', ambiente: 'teste', casos: [{ casoId: a, titulo: 'Leitor é recusado' }] }, c.b); await criarRunNoQase(c.dep, run.id, { confirmado: true }); await executarRunLocal(c.dep, run.id, c.execucao);
  const [bug] = propostasDeBugs(run.id, c.b); assert.equal(bug.tipo, 'bug'); assert.equal(bug.origem, 'PRUMO'); assert.equal(bug.dados.origem, 'SMART-100'); assert.match(bug.dados.descricao, /valor não persistiu/); assert.equal(propostasDeBugs(run.id, c.b).length, 0, 'mesmo bug não é proposto duas vezes');
  assert.equal(c.mundo.jira.issues.size, 4, 'rascunho não cria ticket'); const ed = editarProposta(bug.id, { ...bug.dados, tipoId: '10001' }, {}, c.b); podePublicar(ed);
  const r = await c.rodar('jira.criar_ticket', { tipoId: '10001', resumo: ed.dados.resumo, descricao: ed.dados.descricao, origem: ed.dados.origem, rotulos: ed.dados.rotulos }); assert.equal(r.estado, 'CONFIRMADA'); marcarPublicada(bug.id, { chave: r.remoto.chave, url: r.remoto.url }, c.b);
  associarEspaco(c.e.id, { de: { tipo: 'jira-bug', id: r.remoto.chave, vinculoId: c.jv.id, origem: 'Jira' }, para: { tipo: 'qase', id: String(a), vinculoId: c.qv.id, origem: 'Qase SFQ' }, justificativa: 'Bug aberto pelo Prumo a partir da falha na run' }, c.b, true);
  const rel = obterEspaco(c.e.id, c.b).relacoes.at(-1); assert.equal(rel.origemRegistro, 'REGISTRADO_PELO_PRUMO'); assert.equal(rel.de.tipo, 'jira-bug'); assert.equal(obterProposta(bug.id, c.b).estado, 'PUBLICADA');
  assert.throws(() => associarEspaco(c.e.id, { de: { tipo: 'jira-bug', id: 'SMART-9', origem: 'x' }, para: { tipo: 'qase', id: '1', vinculoId: c.qv.id, origem: 'x' }, justificativa: 'sem vínculo' }, c.b), /TRACE_LINK_SCOPE/);
});

test('propostas da IA: sem duplicata, limite por hora, revisão completa obrigatória e publicação só pela pessoa', async (t) => {
  const c = await cenario(t, { autorizar: false }); const caso = (n) => ({ titulo: n, passos: [{ acao: 'Abrir a tela', esperado: 'Tela visível' }], automacao: 'manual' });
  const p1 = criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', cliente: 'claude', dados: caso('Editor persiste o valor após recarregar'), requisito: 'RQ-01', risco: 'alto' }, c.b);
  assert.equal(p1.estado, 'RASCUNHO'); assert.equal(p1.origem, 'IA'); assert.throws(() => criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', dados: caso('editor persiste o VALOR após recarregar') }, c.b), /DUPLICATE_PROPOSAL/);
  const parecida = criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', dados: caso('Editor persiste valor após recarregar a página') }, c.b); assert.deepEqual(parecida.similares, [p1.id], 'semelhante é sinalizada para a revisão');
  assert.throws(() => podePublicar(p1), /REVIEW_REQUIRED/); assert.throws(() => revisarProposta(p1.id, { duplicidade: true, requisito: true, risco: false, cobertura: true }, 'ana', c.b), /REVIEW_INCOMPLETE/);
  assert.throws(() => revisarProposta(parecida.id, { duplicidade: true, requisito: true, risco: true, cobertura: true }, 'ana', c.b), /REVIEW_REQUIREMENT_MISSING/, 'IA precisa de requisito informado');
  const rev = revisarProposta(p1.id, { duplicidade: true, requisito: true, risco: true, cobertura: true }, 'ana', c.b); assert.equal(rev.estado, 'REVISADA'); assert.equal(podePublicar(rev), true);
  const editada = editarProposta(p1.id, caso('Editor persiste o valor após recarregar (v2)'), {}, c.b); assert.equal(editada.estado, 'RASCUNHO'); assert.equal(editada.revisao, null, 'editar invalida a revisão'); assert.throws(() => podePublicar(editada), /REVIEW_REQUIRED/);
  descartarProposta(parecida.id, c.b); assert.equal(listarPropostas(c.e.id, c.b).find((x) => x.id === parecida.id).estado, 'DESCARTADA'); assert.throws(() => revisarProposta(parecida.id, { duplicidade: true, requisito: true, risco: true, cobertura: true }, 'ana', c.b), /PROPOSAL_CLOSED/);
  for (let i = 0; i < MAX_IA_POR_HORA; i++) { try { criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', dados: caso('Cenário único número ' + i + ' ' + 'abcdefghij'.slice(0, i % 10) + i) }, c.b); } catch (e) { assert.match(e.message, /PROPOSAL_RATE_LIMIT/); break; } }
  assert.throws(() => criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', dados: caso('Mais um cenário que passa do limite') }, c.b), /PROPOSAL_RATE_LIMIT/); assert.ok(criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'PESSOA', dados: caso('A pessoa não é limitada pelo teto da IA') }, c.b));
  assert.equal(c.mundo.qase.casos.length, 0, 'nenhuma proposta chegou ao Qase por conta própria'); assert.throws(() => criarProposta({ espacoId: c.e.id, tipo: 'caso', origem: 'IA', dados: { titulo: 'x' } }, c.b));
});
