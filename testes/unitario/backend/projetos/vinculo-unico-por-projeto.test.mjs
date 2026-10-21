/** Cada projeto do Jira ou do Qase, cada repositório do GitHub e cada pasta local ficam em um único projeto do Prumo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarEspaco, vincularServicoAoEspaco, removerVinculoServico } from '../../../../dist/projetos/servicoProjetos.js';
import { atualizarEspaco, listarEspacos } from '../../../../dist/projetos/banco/projetos.js';
import { vinculoSchema } from '../../../../dist/projetos/contratos.js';
import { donoDaPasta, donoDoRecurso, duplicidadesDoEspaco, exigirPastaLivre, exigirRecursoLivre } from '../../../../dist/projetos/unicidadeDosVinculos.js';

const CONEXAO_A = '00000000-0000-4000-8000-00000000000a';
const CONEXAO_B = '00000000-0000-4000-8000-00000000000b';
const base = (t) => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-unico-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };
const jira = (extra = {}) => ({ id: '10000', chave: 'KAN', nome: 'Qa', instancia: 'https://empresa.atlassian.net', contaId: 'conta-1', tipoId: 'id_api', ...extra });
const github = (extra = {}) => ({ id: '555', chave: 'org/repo', nome: 'repo', instancia: 'https://api.github.com', contaId: '77', tipoId: 'id_api', ...extra });
const qase = (extra = {}) => ({ id: 'PQ', chave: 'PQ', nome: 'Prumo QA', instancia: 'https://api.qase.io', contaId: 'conexao-local:1', tipoId: 'codigo_api', ...extra });

test('criar um projeto a partir de um recurso que já está em outro é recusado, sem deixar projeto nem pasta pela metade', async (t) => {
  const b = base(t);
  const a = await criarEspaco({ nome: 'Plataforma', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_A, recurso: jira() });
  await assert.rejects(criarEspaco({ nome: 'Duplicado', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_B, recurso: jira() }),
    /RESOURCE_ALREADY_LINKED: o projeto do Jira KAN já está no projeto "Plataforma" do Prumo/);
  assert.deepEqual(listarEspacos(b).map((e) => e.id), [a.id]);
  assert.equal(fs.readdirSync(path.join(b, 'espacos')).length, 1, 'nenhuma pasta órfã do projeto recusado');
});

test('vale para os três serviços, mesmo conectando por outra conta (a conta não muda a identidade do recurso)', async (t) => {
  const b = base(t);
  for (const [servico, recurso, outraConta] of [['jira', jira(), jira({ contaId: 'conta-2' })], ['github', github(), github({ contaId: '88' })], ['qase', qase(), qase({ contaId: 'conexao-local:2' })]]) {
    await criarEspaco({ nome: 'Dono ' + servico, descricao: '' }, b, { servico, conexaoId: CONEXAO_A, recurso });
    await assert.rejects(criarEspaco({ nome: 'Outro ' + servico, descricao: '' }, b, { servico, conexaoId: CONEXAO_B, recurso: outraConta }), /RESOURCE_ALREADY_LINKED/, servico);
  }
  assert.equal(listarEspacos(b).length, 3);
});

test('maiúsculas no ID/instância não enganam a regra, mas outro site, outro serviço ou outro recurso continuam livres', async (t) => {
  const b = base(t);
  await criarEspaco({ nome: 'Um', descricao: '' }, b, { servico: 'github', conexaoId: CONEXAO_A, recurso: github({ id: 'ABC' }) });
  await assert.rejects(criarEspaco({ nome: 'Dois', descricao: '' }, b, { servico: 'github', conexaoId: CONEXAO_A, recurso: github({ id: 'abc' }) }), /RESOURCE_ALREADY_LINKED/);
  await criarEspaco({ nome: 'Outro site', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_A, recurso: jira() });
  await criarEspaco({ nome: 'Mesmo ID, outro site Jira', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_B, recurso: jira({ instancia: 'https://filial.atlassian.net' }) });
  await criarEspaco({ nome: 'Mesmo ID, outro serviço', descricao: '' }, b, { servico: 'qase', conexaoId: CONEXAO_B, recurso: qase({ id: '10000', chave: 'KAN' }) });
  await criarEspaco({ nome: 'Outro projeto Jira', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_A, recurso: jira({ id: '10001', chave: 'OUT' }) });
  assert.equal(listarEspacos(b).length, 5);
});

test('vincular um recurso a um projeto existente também respeita a regra, e remover o vínculo libera o recurso', async (t) => {
  const b = base(t);
  const a = await criarEspaco({ nome: 'A', descricao: '' }, b);
  const c = await criarEspaco({ nome: 'C', descricao: '' }, b);
  vincularServicoAoEspaco(a.id, 'github', CONEXAO_A, github(), b);
  assert.throws(() => vincularServicoAoEspaco(c.id, 'github', CONEXAO_A, github(), b), /RESOURCE_ALREADY_LINKED: o repositório do GitHub org\/repo já está no projeto "A" do Prumo/);
  assert.equal(listarEspacos(b).find((e) => e.id === c.id).vinculos.length, 0, 'nada foi gravado no projeto recusado');
  vincularServicoAoEspaco(c.id, 'github', CONEXAO_A, github({ id: '556', chave: 'org/outro' }), b);
  removerVinculoServico(a.id, 'github', b);
  assert.throws(() => vincularServicoAoEspaco(a.id, 'github', CONEXAO_A, github({ id: '556', chave: 'org/outro' }), b), /já está no projeto "C"/);
  vincularServicoAoEspaco(c.id, 'jira', CONEXAO_A, jira(), b);
  vincularServicoAoEspaco(a.id, 'github', CONEXAO_A, github(), b);
  assert.equal(listarEspacos(b).find((e) => e.id === a.id).vinculos[0].recurso.chave, 'org/repo', 'depois de liberado, o repositório pode ir para outro projeto');
});

test('um projeto não conta contra si mesmo: o mesmo vínculo continua só dele', async (t) => {
  const b = base(t);
  const a = await criarEspaco({ nome: 'A', descricao: '' }, b, { servico: 'qase', conexaoId: CONEXAO_A, recurso: qase() });
  assert.equal(donoDoRecurso(listarEspacos(b), 'qase', qase(), a.id), null);
  assert.equal(donoDoRecurso(listarEspacos(b), 'qase', qase())?.id, a.id);
  assert.throws(() => vincularServicoAoEspaco(a.id, 'qase', CONEXAO_A, qase(), b), /WORKSPACE_LINK_EXISTS/);
});

test('pasta local: a mesma pasta (inclusive com letras diferentes) não vai para dois projetos', () => {
  const espacos = [{ id: 'p1', nome: 'Primeiro', pastaLocal: path.join(os.tmpdir(), 'Pasta-Do-Codigo'), vinculos: [] }, { id: 'p2', nome: 'Segundo', vinculos: [] }];
  assert.equal(donoDaPasta(espacos, path.join(os.tmpdir(), 'pasta-do-codigo'))?.id, 'p1');
  assert.throws(() => exigirPastaLivre(espacos, path.join(os.tmpdir(), 'PASTA-DO-CODIGO'), 'p2'), /WORKSPACE_LOCAL_DUPLICATE: esta pasta já é do projeto "Primeiro" do Prumo/);
  assert.doesNotThrow(() => exigirPastaLivre(espacos, path.join(os.tmpdir(), 'pasta-do-codigo'), 'p1'), 'o próprio projeto pode manter a pasta');
  assert.doesNotThrow(() => exigirPastaLivre(espacos, path.join(os.tmpdir(), 'outra-pasta'), 'p2'));
});

test('duplicidades que já existiam antes da regra são identificadas nos dois projetos, sem apagar nada', async (t) => {
  const b = base(t);
  const a = await criarEspaco({ nome: 'Antigo A', descricao: '' }, b, { servico: 'jira', conexaoId: CONEXAO_A, recurso: jira() });
  const c = await criarEspaco({ nome: 'Antigo C', descricao: '' }, b);
  atualizarEspaco(c.id, (e) => { e.vinculos.push(vinculoSchema.parse({ id: '11111111-1111-4111-8111-111111111111', servico: 'jira', conexaoId: CONEXAO_B, recurso: jira(), validadoEm: new Date().toISOString(), estado: 'VALIDO' })); e.pastaLocal = undefined; }, b);
  const todos = listarEspacos(b);
  assert.deepEqual(duplicidadesDoEspaco(todos.find((e) => e.id === a.id), todos), [{ onde: 'jira', projeto: 'Antigo C' }]);
  assert.deepEqual(duplicidadesDoEspaco(todos.find((e) => e.id === c.id), todos), [{ onde: 'jira', projeto: 'Antigo A' }]);
  assert.equal(todos.filter((e) => e.vinculos.length).length, 2, 'nada foi removido automaticamente');
  assert.throws(() => exigirRecursoLivre(todos, 'jira', jira()), /RESOURCE_ALREADY_LINKED/);
});
