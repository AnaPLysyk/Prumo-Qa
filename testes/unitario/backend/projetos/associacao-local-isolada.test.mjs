import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const espacoId = randomUUID(), outroId = randomUUID();
const casoId = randomUUID(), ticketId = randomUUID(), casoOutro = randomUUID();
const espaco = { id: espacoId, vinculos: [], relacoes: [], historico: [] };
const propostas = [
  { id: casoId, espacoId, tipo: 'caso', origem: 'PESSOA', remoto: null, estado: 'RASCUNHO' },
  { id: ticketId, espacoId, tipo: 'bug', origem: 'PESSOA', remoto: null, estado: 'RASCUNHO' },
  { id: casoOutro, espacoId: outroId, tipo: 'caso', origem: 'PESSOA', remoto: null, estado: 'RASCUNHO' }
];
mock.module('../../../../dist/projetos/repositorio.js', { exports: {
  atualizarEspaco: (id, fn) => { assert.equal(id, espacoId); fn(espaco); return espaco; },
  gravarEspacos: () => { throw new Error('UNEXPECTED_REPOSITORY_WRITE'); },
  lerEspacos: () => { throw new Error('UNEXPECTED_REPOSITORY_READ'); },
  listarEspacos: () => { throw new Error('UNEXPECTED_REPOSITORY_LIST'); },
  gravarPastasVinculadas: () => { throw new Error('UNEXPECTED_LINK_WRITE'); },
  lerPastasVinculadas: () => { throw new Error('UNEXPECTED_LINK_READ'); },
  obterEspaco: () => { throw new Error('UNEXPECTED_WORKSPACE_READ'); }
} });
mock.module('../../../../dist/tickets/repositorio.js', { exports: {
  listarPropostas: id => propostas.filter(p => p.espacoId === id)
} });
mock.module('../../../../dist/testes/repositorioLocal.js', { exports: {
  lerRepositorioLocal: () => ({ version: 1, casos: [], suites: [] })
} });
const { associarEspaco } = await import('../../../../dist/projetos/servicoProjetos.js');
const ref = (tipo, id, origem = 'prumo') => ({ tipo, id, origem });
const vincular = (de, para) => associarEspaco(espacoId, { de, para, justificativa: 'Cobertura declarada pela pessoa' });

test('sem banco: associa caso e ticket locais do mesmo projeto e recusa duplicata', () => {
  const r = vincular(ref('caso-local', casoId), ref('ticket-local', ticketId));
  assert.equal(r.relacoes.length, 1);
  assert.equal(r.relacoes[0].origemRegistro, 'DECLARADO_PELO_USUARIO');
  assert.throws(() => vincular(ref('caso-local', casoId), ref('ticket-local', ticketId)), /TRACE_DUPLICATE/);
});

test('sem banco: recusa referencia de outro projeto, id inexistente e tipo incorreto', () => {
  assert.throws(() => vincular(ref('caso-local', casoOutro), ref('ticket-local', ticketId)), /TRACE_LOCAL_REFERENCE_INVALID/);
  assert.throws(() => vincular(ref('caso-local', randomUUID()), ref('ticket-local', ticketId)), /TRACE_LOCAL_REFERENCE_INVALID/);
  assert.throws(() => vincular(ref('ticket-local', casoId), ref('caso-local', ticketId)), /TRACE_LOCAL_REFERENCE_INVALID/);
});

test('sem banco: recusa origem falsa e Jira nao vinculado', () => {
  assert.throws(() => vincular(ref('caso-local', casoId, 'qase'), ref('ticket-local', ticketId)), /TRACE_LOCAL_REFERENCE_INVALID/);
  assert.throws(() => vincular(ref('caso-local', casoId), ref('jira', 'KAN-999', 'https://jira.example.test')), /TRACE_LINK_SCOPE/);
});
