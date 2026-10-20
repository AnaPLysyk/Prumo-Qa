import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const pA = randomUUID(), pB = randomUUID(), antigoId = randomUUID();
const projeto = { id: pA, vinculos: [] };
const legados = [
  { id: antigoId, espacoId: pA, tipo: 'caso', origem: 'PESSOA', estado: 'RASCUNHO', remoto: null,
    titulo: 'Caso manual antigo', dados: { titulo: 'Caso manual antigo', descricao: 'legado', suiteId: 5, ticket: 'KAN-9', passos: [] },
    requisito: 'REQ 1', risco: '', criadaEm: '2026-10-01T00:00:00.000Z', atualizadaEm: '2026-10-01T00:00:00.000Z' },
  { id: randomUUID(), espacoId: pB, tipo: 'caso', origem: 'PESSOA', estado: 'RASCUNHO', remoto: null, titulo: 'Outro projeto', dados: { titulo: 'Outro projeto' }, requisito: '', risco: '', criadaEm: '2026-10-01T00:00:00.000Z', atualizadaEm: '2026-10-01T00:00:00.000Z' },
  { id: randomUUID(), espacoId: pA, tipo: 'caso', origem: 'IA', estado: 'RASCUNHO', remoto: null, titulo: 'Sugestão de IA', dados: { titulo: 'Sugestão de IA' }, requisito: '', risco: '', criadaEm: '2026-10-01T00:00:00.000Z', atualizadaEm: '2026-10-01T00:00:00.000Z' }
];
mock.module('../../../../dist/projetos/banco/projetos.js', { exports: { obterEspaco: id => {
  if (id !== pA && id !== pB) throw new Error('WORKSPACE_NOT_FOUND');
  return { ...projeto, id };
} } });
mock.module('../../../../dist/tickets/banco/tickets.js', { exports: { listarPropostas: id => legados.filter(p => p.espacoId === id) } });
const { listarRepositorioLocal } = await import('../../../../dist/testes/servicoCasos.js');
const { salvarCasoLocal } = await import('../../../../dist/testes/servicoCasos.js');
const { salvarSuiteLocal } = await import('../../../../dist/testes/servicoCasos.js');

const diretorio = t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-local-fixture-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return base;
};
test('leitura do legado nao cria arquivo nem perde o ID original; ignora IA e outro projeto', t => {
  const b = diretorio(t);
  const r = listarRepositorioLocal(pA, b);
  assert.equal(r.casos.length, 1); assert.equal(r.casos[0].id, antigoId);
  assert.equal(r.casos[0].legado, true);
  assert.equal(r.casos[0].dados.titulo, 'Caso manual antigo');
  assert.equal('suiteId' in r.casos[0].dados, false);
  assert.equal('ticket' in r.casos[0].dados, false);
  assert.deepEqual(r.casos[0].referenciasLegadas, { ticket: 'KAN-9', suiteId: 5 });
  assert.equal(fs.existsSync(path.join(b, 'plataforma', 'repositorio-testes-local.json')), false);
});
test('editar legado faz copia atomica com o mesmo ID sem modificar propostas', t => {
  const b = diretorio(t);
  const dadosAntes = JSON.stringify(legados);
  const r = salvarCasoLocal({ espacoId: pA, id: antigoId, dados: { titulo: 'Caso manual melhorado', descricao: 'atual', passos: [{ acao: 'clicar', esperado: 'abrir' }] } }, b);
  assert.equal(r.id, antigoId);
  assert.equal(r.dados.passos.length, 1);
  assert.equal(JSON.stringify(legados), dadosAntes);
  const itens = listarRepositorioLocal(pA, b);
  assert.equal(itens.casos.length, 1);
  assert.equal(itens.casos[0].titulo, 'Caso manual melhorado');
  assert.equal(itens.casos[0].legado, undefined);
  assert.deepEqual(itens.casos[0].referenciasLegadas, { ticket: 'KAN-9', suiteId: 5 });
  assert.equal(itens.casos[0].requisito, 'REQ 1', 'edição sem requisito mantém o valor original');
});
test('suítes e casos offline por projeto, referência a suite obrigatória', t => {
  const b = diretorio(t);
  const pai = salvarSuiteLocal({ espacoId: pA, titulo: 'Funcional' }, b);
  const filha = salvarSuiteLocal({ espacoId: pA, titulo: 'Login', paiId: pai.id }, b);
  assert.equal(listarRepositorioLocal(pA, b).suites.length, 2);
  const c = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Validar login' }, suiteLocalId: filha.id }, b);
  assert.equal(c.suiteLocalId, filha.id);
  assert.throws(() => salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso sem suite' }, suiteLocalId: randomUUID() }, b), /LOCAL_SUITE_SCOPE/);
  assert.equal(listarRepositorioLocal(pB, b).casos.length, 1);
  assert.equal(listarRepositorioLocal(pB, b).suites.length, 0);
});
test('rejeita ciclos de suítes e bloqueia cadastros locais com Qase vinculado', t => {
  const b = diretorio(t);
  const a = salvarSuiteLocal({ espacoId: pA, titulo: 'Alpha' }, b);
  const c = salvarSuiteLocal({ espacoId: pA, titulo: 'Beta', paiId: a.id }, b);
  assert.throws(() => salvarSuiteLocal({ espacoId: pA, id: a.id, titulo: 'Alpha', paiId: c.id }, b), /LOCAL_SUITE_CYCLE/);
  projeto.vinculos = [{ servico: 'qase' }];
  try {
    assert.throws(() => salvarSuiteLocal({ espacoId: pA, titulo: 'Impossível' }, b), /LOCAL_SUITE_QASE_LINKED/);
    assert.throws(() => salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Impossível' } }, b), /LOCAL_CASE_QASE_LINKED/);
  } finally { projeto.vinculos = []; }
});

test('não sobrescreve caso de outro projeto quando um ID antigo coincide', t => {
  const b = diretorio(t);
  const deB = salvarCasoLocal({ espacoId: pB, dados: { titulo: 'Caso de outro projeto' } }, b);
  legados.push({ ...legados[0], id: deB.id });
  try {
    assert.throws(() => salvarCasoLocal({ espacoId: pA, id: deB.id, dados: { titulo: 'Tentativa cruzada' } }, b), /LOCAL_CASE_SCOPE/);
    assert.equal(listarRepositorioLocal(pB, b).casos[0].titulo, 'Caso de outro projeto');
  } finally { legados.pop(); }
});
test('mascara segredos antes de armazenar texto de casos e suítes', t => {
  const b = diretorio(t);
  const c = salvarCasoLocal({ espacoId: pA, dados: {
    titulo: 'Caso com segredo', descricao: 'Authorization: Bearer abc.123.z', passos: [{ acao: 'Usar Bearer abc.123.z' }]
  } }, b);
  assert.equal(c.dados.descricao.includes('abc.123.z'), false);
  assert.equal(c.dados.passos[0].acao.includes('abc.123.z'), false);
  const s = salvarSuiteLocal({ espacoId: pA, titulo: 'Funcional', descricao: 'token=abc123xyz' }, b);
  assert.equal(s.descricao.includes('abc123xyz'), false);
});
