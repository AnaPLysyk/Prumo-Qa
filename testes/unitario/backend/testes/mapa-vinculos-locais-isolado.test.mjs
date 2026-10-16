/** Grafo de casos e tickets, em memória: não acessa banco, Electron ou integrações remotas. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const espacoId = randomUUID(), casoId = randomUUID(), ticketId = randomUUID();
const ligacao = {
  de: { tipo: 'caso-local', id: casoId, origem: 'prumo' },
  para: { tipo: 'ticket-local', id: ticketId, origem: 'prumo' },
  justificativa: 'Cobre ticket local', origemRegistro: 'DECLARADO_PELO_USUARIO', estado: 'VINCULADO'
};
const espaco = { id: espacoId, nome: 'Projeto sintético', vinculos: [], relacoes: [ligacao] };
const caso = { id: casoId, titulo: 'Validar autenticação local', dados: { titulo: 'Validar autenticação local' } };
const ticket = { id: ticketId, titulo: 'Corrigir autenticação', espacoId, tipo: 'bug', origem: 'PESSOA', estado: 'RASCUNHO', remoto: null };

mock.module('../../../../dist/projetos/banco/obterEspaco.js', { namedExports: { obterEspaco: id => {
  assert.equal(id, espacoId); return espaco;
} } });
mock.module('../../../../dist/testes/regras/listarRepositorioLocal.js', { namedExports: { listarRepositorioLocal: id => {
  assert.equal(id, espacoId); return { casos: [caso], suites: [] };
} } });
mock.module('../../../../dist/tickets/banco/listarPropostas.js', { namedExports: { listarPropostas: id => {
  assert.equal(id, espacoId); return [ticket];
} } });
mock.module('../../../../dist/conexoes/banco/listarOperacoes.js', { namedExports: { listarOperacoes: () => [] } });
mock.module('../../../../dist/testes/banco/listarRunsLocais.js', { namedExports: { listarRunsLocais: () => [] } });
mock.module('../../../../dist/agendamentos/banco/listarTrabalhos.js', { namedExports: { listarTrabalhos: () => [] } });
mock.module('../../../../dist/testes/regras/catalogoDeTestes.js', { namedExports: { catalogoDeTestes: () => { throw new Error('Não pode consultar projeto real'); } } });

const { mapaDeVinculos } = await import('../../../../dist/testes/regras/mapaDeVinculos.js');

test('mapa usa nomes atuais dos registros mesmo quando vínculos criaram nós antecipadamente', () => {
  const g = mapaDeVinculos(espacoId);
  const c = g.nos.filter(n => n.id === 'caso-local:' + casoId);
  const t = g.nos.filter(n => n.id === 'ticket-local:' + ticketId);
  assert.equal(c.length, 1); assert.equal(t.length, 1);
  assert.equal(c[0].rotulo, 'Validar autenticação local');
  assert.equal(t[0].rotulo, 'Corrigir autenticação');
  assert.equal(g.arestas.filter(a => a.tipo === 'relacionado a').length, 1);
  assert.equal(g.arestas.filter(a => a.tipo === 'possui registro local').length, 2);
  assert.equal(g.lacunas.filter(l => l.tipo === 'CASO_SEM_TICKET').length, 0);
});

test('sem relação cadastrada, o mapa aponta lacuna com título real sem inventar cobertura', () => {
  const antes = espaco.relacoes;
  espaco.relacoes = [];
  try {
    const g = mapaDeVinculos(espacoId);
    assert.equal(g.lacunas.filter(l => l.tipo === 'CASO_SEM_TICKET').length, 1);
    assert.match(g.lacunas.find(l => l.tipo === 'CASO_SEM_TICKET').mensagem, /Validar autenticação local/);
    assert.equal(g.arestas.some(a => a.origem === 'OBSERVADO'), false);
  } finally { espaco.relacoes = antes; }
});

test('Jira ligado a caso local não é falso ticket sem caso', () => {
  const antes = espaco.relacoes;
  espaco.relacoes = [{ ...ligacao, de: { tipo: 'jira', id: 'KAN-7', origem: 'jira.test' },
    para: { tipo: 'caso-local', id: casoId, origem: 'prumo' } }];
  try {
    const g = mapaDeVinculos(espacoId);
    assert.equal(g.lacunas.filter(x => x.tipo === 'TICKET_SEM_CASO' && x.id === 'jira:KAN-7').length, 0);
    assert.equal(g.lacunas.filter(x => x.tipo === 'TICKET_SEM_CASO' && x.id === 'ticket-local:' + ticketId).length, 1);
    assert.equal(g.lacunas.filter(x => x.tipo === 'CASO_SEM_TICKET').length, 0);
    assert.ok(g.arestas.some(x => x.de === 'jira:KAN-7' && x.para === 'caso-local:' + casoId));
  } finally { espaco.relacoes = antes; }
});

test('Jira sem caso Qase ou local associado gera lacuna verdadeira', () => {
  const antes = espaco.relacoes;
  espaco.relacoes = [{ ...ligacao, de: { tipo: 'jira', id: 'KAN-8', origem: 'jira.test' },
    para: { tipo: 'ticket-local', id: ticketId, origem: 'prumo' } }];
  try {
    const g = mapaDeVinculos(espacoId);
    const faltas = g.lacunas.filter(x => x.tipo === 'TICKET_SEM_CASO' && x.id === 'jira:KAN-8');
    assert.equal(faltas.length, 1);
    assert.match(faltas[0].mensagem, /KAN-8/);
  } finally { espaco.relacoes = antes; }
});

test('ticket local sem caso associado aparece como lacuna, não some do diagnóstico', () => {
  const original = espaco.relacoes;
  espaco.relacoes = [];
  try {
    const g = mapaDeVinculos(espacoId);
    const falta = g.lacunas.find(x => x.tipo === 'TICKET_SEM_CASO' && x.id === 'ticket-local:' + ticketId);
    assert.ok(falta);
    assert.match(falta.mensagem, /Corrigir autenticação/);
  } finally { espaco.relacoes = original; }
});
test('ticket local vinculado ao caso local não produz lacuna falsa', () => {
  const g = mapaDeVinculos(espacoId);
  assert.equal(g.lacunas.some(x => x.tipo === 'TICKET_SEM_CASO' && x.id === 'ticket-local:' + ticketId), false);
});
