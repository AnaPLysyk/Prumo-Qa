import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const pA = randomUUID(), pB = randomUUID(), antigoId = randomUUID();
const projeto = { id: pA, vinculos: [], relacoes: [] };
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
}, atualizarEspaco: (id, fn) => fn(projeto) } });
mock.module('../../../../dist/tickets/banco/tickets.js', { exports: { listarPropostas: id => legados.filter(p => p.espacoId === id) } });
const { listarRepositorioLocal } = await import('../../../../dist/testes/servicoCasos.js');
const { salvarCasoLocal } = await import('../../../../dist/testes/servicoCasos.js');
const { salvarSuiteLocal, removerCasoLocal, removerSuiteLocal, importarRepositorioLocal } = await import('../../../../dist/testes/servicoCasos.js');

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
test('rejeita ciclos de suítes e permite escrever no Prumo com Qase vinculado', t => {
  const b = diretorio(t);
  const a = salvarSuiteLocal({ espacoId: pA, titulo: 'Alpha' }, b);
  const c = salvarSuiteLocal({ espacoId: pA, titulo: 'Beta', paiId: a.id }, b);
  assert.throws(() => salvarSuiteLocal({ espacoId: pA, id: a.id, titulo: 'Alpha', paiId: c.id }, b), /LOCAL_SUITE_CYCLE/);
  projeto.vinculos = [{ servico: 'qase' }];
  try {
    assert.equal(salvarSuiteLocal({ espacoId: pA, titulo: 'Gamma' }, b).titulo, 'Gamma');
    assert.equal(salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso com Qase' } }, b).titulo, 'Caso com Qase');
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

test('cada caso do Prumo recebe um número próprio estável por projeto', t => {
  const b = diretorio(t);
  const a = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Primeiro caso' } }, b);
  const c = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Segundo caso' } }, b);
  const outro = salvarCasoLocal({ espacoId: pB, dados: { titulo: 'Caso de outro projeto' } }, b);
  assert.deepEqual([a.numero, c.numero, outro.numero], [1, 2, 1]);
  assert.equal(salvarCasoLocal({ espacoId: pA, id: a.id, dados: { titulo: 'Primeiro caso editado' } }, b).numero, 1, 'editar não troca o número');
  removerCasoLocal(pA, a.id, b);
  assert.equal(salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Terceiro caso' } }, b).numero, 3, 'número removido não é reaproveitado para outro caso');
  const ultimo = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Quarto caso' } }, b);
  removerCasoLocal(pA, ultimo.id, b);
  assert.equal(salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Quinto caso' } }, b).numero, 5, 'nem o número do último removido volta');
});

test('remover caso apaga só o caso e os vínculos dele, dentro do projeto', t => {
  const b = diretorio(t);
  const a = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso para remover' } }, b);
  const fica = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso que fica' } }, b);
  projeto.relacoes = [{ de: { tipo: 'caso-local', id: a.id }, para: { tipo: 'jira', id: 'KAN-1' } }, { de: { tipo: 'caso-local', id: fica.id }, para: { tipo: 'jira', id: 'KAN-2' } }];
  try {
    assert.throws(() => removerCasoLocal(pB, a.id, b), /LOCAL_CASE_NOT_FOUND/, 'outro projeto não remove');
    assert.equal(removerCasoLocal(pA, a.id, b).titulo, 'Caso para remover');
    assert.equal(listarRepositorioLocal(pA, b).casos.some(c => c.id === a.id), false);
    assert.equal(listarRepositorioLocal(pA, b).casos.some(c => c.id === fica.id), true);
    assert.deepEqual(projeto.relacoes.map(r => r.de.id), [fica.id]);
    assert.throws(() => removerCasoLocal(pA, a.id, b), /LOCAL_CASE_NOT_FOUND/);
  } finally { projeto.relacoes = []; }
});

test('tag com segredo é recusada e texto sem caracteres de controle nem inversão de direção', t => {
  const b = diretorio(t);
  assert.throws(() => salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso com tag secreta', tags: ['ghp_abcdefghijklmnopqrstuvwxyz0123456789'] } }, b), /TAG_SECRET/);
  const c = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Titulo com‮ controle', passos: [{ acao: 'Passo um', formato: 'normal' }] } }, b);
  assert.equal(c.titulo, 'Titulo com controle'); assert.equal(c.dados.passos[0].acao, 'Passo um');
});

test('remover suíte local sobe filhas e casos para o pai, não apaga nada junto e respeita o projeto', t => {
  const b = diretorio(t);
  const avo = salvarSuiteLocal({ espacoId: pA, titulo: 'Avô' }, b);
  const meio = salvarSuiteLocal({ espacoId: pA, titulo: 'Meio', paiId: avo.id }, b);
  const filha = salvarSuiteLocal({ espacoId: pA, titulo: 'Filha', paiId: meio.id }, b);
  const caso = salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Caso no meio', passos: [] }, suiteLocalId: meio.id }, b);
  const r = removerSuiteLocal(pA, meio.id, b);
  assert.equal(r.casosMovidos, 1);
  const depois = listarRepositorioLocal(pA, b);
  assert.equal(depois.suites.some(x => x.id === meio.id), false);
  assert.equal(depois.suites.find(x => x.id === filha.id).paiId, avo.id);
  assert.equal(depois.casos.find(x => x.id === caso.id).suiteLocalId, avo.id);
  assert.throws(() => removerSuiteLocal(pB, avo.id, b), /LOCAL_SUITE_NOT_FOUND/);
  assert.throws(() => removerSuiteLocal(pA, randomUUID(), b), /LOCAL_SUITE_NOT_FOUND/);
});

test('exportar e importar: os casos e suítes saem no formato da tela e entram em outro projeto como cópias', t => {
  const b = diretorio(t);
  const pai = salvarSuiteLocal({ espacoId: pA, titulo: 'Funcional' }, b);
  const filha = salvarSuiteLocal({ espacoId: pA, titulo: 'Login', paiId: pai.id }, b);
  salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Com suíte', passos: [] }, suiteLocalId: filha.id }, b);
  salvarCasoLocal({ espacoId: pA, dados: { titulo: 'Solto', passos: [] } }, b);
  const origem = listarRepositorioLocal(pA, b);
  const arquivo = JSON.parse(JSON.stringify({ version: 1, casos: origem.casos.filter(c => !c.legado), suites: origem.suites }));
  assert.deepEqual(importarRepositorioLocal(pB, arquivo, b), { casos: 2, suites: 2 });
  const destino = listarRepositorioLocal(pB, b);
  assert.deepEqual(destino.casos.map(c => c.titulo).sort(), ['Com suíte', 'Outro projeto', 'Solto']);
  const novaFilha = destino.suites.find(s => s.titulo === 'Login');
  assert.equal(novaFilha.paiId, destino.suites.find(s => s.titulo === 'Funcional').id);
  assert.equal(destino.casos.find(c => c.titulo === 'Com suíte').suiteLocalId, novaFilha.id);
  assert.equal(destino.casos.find(c => c.titulo === 'Solto').suiteLocalId, null);
  assert.equal(listarRepositorioLocal(pA, b).casos.filter(c => !c.legado).length, 2);
});
