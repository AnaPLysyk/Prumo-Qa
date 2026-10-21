/** Dentro de um projeto do Prumo, conectar o Qase só guarda a conta; o projeto do Qase é escolhido depois, um por vez. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importarProjetosQase } from '../../../../dist/conexoes/regras/importarProjetosQase.js';
import { cofreCredenciais } from '../../../../dist/conexoes/banco/credenciais.js';
import { lerContasDeServico } from '../../../../dist/conexoes/banco/contasDeServico.js';
import { lerEspacos } from '../../../../dist/projetos/banco/projetos.js';

const protetor = { disponivel: () => true, proteger: (s) => Buffer.from(s), abrir: (b) => b.toString() };

function ambiente(t, protegido = protetor) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-qase-conectar-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const transporte = async (p) => {
    if (p.servico === 'qase' && p.caminho.startsWith('/v1/project')) return { status: true, result: { total: 2, entities: [{ code: 'PQ', title: 'Prumo QA' }, { code: 'AP', title: 'App' }] } };
    throw new Error('inesperado ' + p.caminho);
  };
  const c = { protetor: protegido, transporte, escrita: async () => ({}), base, cofre: cofreCredenciais(protegido, base) };
  return { c, base, qase: importarProjetosQase(c) };
}

test('conectar guarda só a conta no cofre, não cria nenhum projeto do Prumo e descarta a prévia', async (t) => {
  const { c, base, qase } = ambiente(t);
  const previa = await qase.prever('token-do-qase');
  assert.equal(previa.projetos.length, 2);
  const conta = await qase.conectar(previa.previaId);
  assert.equal(conta.nome, 'Qase');
  assert.deepEqual(Object.keys(conta).sort(), ['id', 'nome'], 'nada além de id e nome volta para a tela');
  assert.equal(c.cofre.ler(conta.id), 'token-do-qase');
  assert.equal(lerContasDeServico(base).contas.length, 1);
  assert.equal(lerEspacos(base).espacos.length, 0, 'quem cria ou vincula projeto é a escolha seguinte');
  await assert.rejects(qase.conectar(previa.previaId), /QASE_PREVIEW_EXPIRED/, 'a prévia é de uso único');
});

test('o mesmo token conectado de novo reaproveita a conta em vez de duplicar', async (t) => {
  const { base, qase } = ambiente(t);
  const a = await qase.conectar((await qase.prever('mesmo-token')).previaId);
  const b = await qase.conectar((await qase.prever('mesmo-token')).previaId);
  assert.equal(a.id, b.id);
  assert.equal(lerContasDeServico(base).contas.length, 1);
});

test('prévia inexistente ou cancelada não conecta nada', async (t) => {
  const { base, qase } = ambiente(t);
  await assert.rejects(qase.conectar('00000000-0000-4000-8000-000000000000'), /QASE_PREVIEW_EXPIRED/);
  const previa = await qase.prever('token-x');
  qase.cancelar(previa.previaId);
  await assert.rejects(qase.conectar(previa.previaId), /QASE_PREVIEW_EXPIRED/);
  assert.equal(lerContasDeServico(base).contas.length, 0);
});

test('token sem cofre do sistema nem chega a ser verificado', async (t) => {
  const { qase } = ambiente(t, { ...protetor, disponivel: () => false });
  await assert.rejects(qase.prever('token-y'), /CREDENTIAL_PROTECTION_UNAVAILABLE/);
});
