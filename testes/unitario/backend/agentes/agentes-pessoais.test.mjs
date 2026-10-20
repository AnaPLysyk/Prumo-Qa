// Agentes criados pela pessoa: só o dono vê, edita e exclui; público, as outras contas veem só para leitura; ninguém mais (nem a Administração).
// Pasta de dados temporária; nada toca a pasta da pessoa.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { excluirAgentePessoal, importarPreviasAntigas, listarAgentesPessoais, salvarAgentePessoal } from '../../../../dist/agentes/regras/agentesPessoais.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';
import { acessoDosCanais } from '../../../../dist/login/tipos/acessoDosCanais.js';
import { encerrarSessao } from '../../../../dist/login/regras/sessao.js';
import { lerContas } from '../../../../dist/login/banco/lerContas.js';
import { criarContaPelaAdministracao } from '../../../../dist/administracao/servico.js';
import { criarPrimeiraConta } from '../../infra/contas-por-email.mjs';

const PROJETO = '11111111-1111-4111-8111-111111111111'; const OUTRO = '22222222-2222-4222-8222-222222222222';
const AGENTE = { nome: 'Regressão da Ana', descricao: 'Revisa regressão', objetivo: 'Achar regressões', instrucoes: 'Ler os testes que falharam', publico: false };
async function contas(t) {
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-agentes-pessoais-')); t.after(() => { encerrarSessao(); fs.rmSync(b, { recursive: true, force: true }); });
  await criarPrimeiraConta({ email: 'ana@prumo.test', nome: 'Ana', senha: 'Agentes-firme-26' }, b);
  await criarContaPelaAdministracao({ login: 'bia', nome: 'Bia QA', papel: 'qa' }, b); encerrarSessao();
  const [ana, bia] = lerContas(b).usuarios; return { b, ana: ana.id, bia: bia.id };
}

test('privado: só o dono vê; público: as outras contas veem só para leitura, com o nome do dono', async (t) => {
  const { b, ana, bia } = await contas(t);
  const { id } = salvarAgentePessoal(PROJETO, AGENTE, ana, b);
  assert.deepEqual(listarAgentesPessoais(PROJETO, ana, b).map((a) => [a.nome, a.meu, a.publico]), [['Regressão da Ana', true, false]]);
  assert.deepEqual(listarAgentesPessoais(PROJETO, bia, b), [], 'privado não aparece para outra conta');
  assert.deepEqual(listarAgentesPessoais(OUTRO, ana, b), [], 'é do projeto onde foi criado');
  salvarAgentePessoal(PROJETO, { ...AGENTE, id, publico: true }, ana, b);
  const daBia = listarAgentesPessoais(PROJETO, bia, b);
  assert.deepEqual(daBia.map((a) => [a.id, a.meu, a.dono, a.publico]), [[id, false, 'Ana', true]]);
  assert.ok(!JSON.stringify(daBia).includes(ana), 'o id da dona não vai para a janela de outra conta');
});

test('só o dono edita e exclui: id de outra pessoa responde como inexistente, mesmo público', async (t) => {
  const { b, ana, bia } = await contas(t);
  const { id } = salvarAgentePessoal(PROJETO, { ...AGENTE, publico: true }, ana, b);
  assert.throws(() => salvarAgentePessoal(PROJETO, { ...AGENTE, id, nome: 'Tomado pela Bia', publico: true }, bia, b), /AGENT_NOT_FOUND/);
  assert.throws(() => salvarAgentePessoal(OUTRO, { ...AGENTE, id, nome: 'Outro projeto', publico: true }, bia, b), /AGENT_NOT_FOUND/, 'mesmo id em outro projeto também não');
  assert.throws(() => excluirAgentePessoal(id, bia, b), /AGENT_NOT_FOUND/);
  assert.equal(listarAgentesPessoais(PROJETO, ana, b)[0].nome, 'Regressão da Ana');
  assert.deepEqual(excluirAgentePessoal(id, ana, b), { excluido: true }); assert.deepEqual(listarAgentesPessoais(PROJETO, ana, b), []);
});

test('formato e limites: campos conferidos, 50 por pessoa e projeto; prévias antigas viram agentes privados de quem importa', async (t) => {
  const { b, ana, bia } = await contas(t);
  for (const ruim of [{ ...AGENTE, nome: '' }, { ...AGENTE, objetivo: ' ' }, { ...AGENTE, extra: 1 }, { ...AGENTE, id: '../x' }, { ...AGENTE, instrucoes: 'x'.repeat(4001) }]) assert.throws(() => salvarAgentePessoal(PROJETO, ruim, ana, b));
  for (let i = 0; i < 50; i++) salvarAgentePessoal(PROJETO, { ...AGENTE, nome: 'A' + i }, ana, b);
  assert.throws(() => salvarAgentePessoal(PROJETO, AGENTE, ana, b), /AGENT_LIMIT/);
  const r = importarPreviasAntigas(PROJETO, [{ id: 'previa-1', nome: 'Antiga', descricao: '', objetivo: 'Ler', instrucoes: 'Só ler' }, { id: 'previa-2', nome: '', descricao: '', objetivo: 'x', instrucoes: 'y' }], bia, b);
  assert.deepEqual(r, { importados: 1 }); assert.deepEqual(listarAgentesPessoais(PROJETO, bia, b).filter((a) => a.meu).map((a) => [a.id, a.publico]), [['previa-1', false]]);
  assert.equal(listarAgentesPessoais(PROJETO, ana, b).some((a) => a.id === 'previa-1'), false, 'a importação é privada');
});

test('canais: listar pede Agentes: Ver; criar, excluir e importar pedem Agentes: Usar; esquemas estritos', () => {
  assert.deepEqual(acessoDosCanais['agentes:pessoais'], ['agentes', 'VER']);
  for (const c of ['agentes:pessoalsalvar', 'agentes:pessoalexcluir', 'agentes:pessoaisimportar']) assert.deepEqual(acessoDosCanais[c], ['agentes', 'USAR'], c);
  assert.equal(esquemasIpc['agentes:pessoalsalvar'].safeParse({ espacoId: PROJETO, agente: { ...AGENTE, donoId: '33333333-3333-4333-8333-333333333333' } }).success, false, 'a janela não escolhe o dono');
});
