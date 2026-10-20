// Marca admin: só ela libera a tela Administração; o papel cuida das telas de trabalho. Pasta temporária por teste, sem janela.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { entrarNaConta, sairDaConta, trocarMinhaSenha } from '../../../../dist/login/regras/contas.js';
import { cadastrarComEmail, criarPrimeiraConta } from '../../../apoio/contas-por-email.mjs';
import { alterarContaPelaAdministracao, criarContaPelaAdministracao, listarContasDeAcesso } from '../../../../dist/administracao/servico.js';
import { salvarConfiguracaoDeAcesso } from '../../../../dist/administracao/servico.js';
import { conferirAcessoAoCanal } from '../../../../dist/login/regras/conferirAcessoAoCanal.js';
import { ehAdmin, encerrarSessao, sessaoParaJanela } from '../../../../dist/login/regras/sessao.js';

const pasta = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-admin-')); t.after(() => { encerrarSessao(); fs.rmSync(d, { recursive: true, force: true }); }); return d; };
const ADMIN = { login: 'ana.admin', nome: 'Ana Admin', senha: 'Prumo-admin-2026' };
const codigo = async (fn, padrao) => { await assert.rejects(async () => fn(), (e) => { assert.match(e.message, padrao); return true; }); };
// Entra com a conta criada pela Administração e troca a senha temporária (senão os canais pedem a troca antes).
async function entrarComo(b, criada, login) { sairDaConta(b); await entrarNaConta({ login, senha: criada.senhaTemporaria }, b); await trocarMinhaSenha({ atual: criada.senhaTemporaria, nova: 'Nova-senha-forte-2026' }, b); }

test('a primeira conta nasce admin e vê a Administração', async (t) => {
  const b = pasta(t); const r = await criarPrimeiraConta(ADMIN, b);
  assert.equal(r.conta.admin, true); assert.equal(sessaoParaJanela(b).telas.administracao, 'USAR');
  assert.doesNotThrow(() => conferirAcessoAoCanal('usuarios:listar', b));
});

test('papel Administrador sem a marca não vê a Administração; papel comum com a marca vê', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  const semMarca = await criarContaPelaAdministracao({ login: 'papel.admin', nome: 'Papel Admin', papel: 'administrador' }, b);
  const comMarca = await criarContaPelaAdministracao({ login: 'qa.dev', nome: 'QA Dev', papel: 'qa', admin: true }, b);
  assert.equal(semMarca.conta.admin, false); assert.equal(comMarca.conta.admin, true);
  await entrarComo(b, semMarca, 'papel.admin');
  assert.equal(sessaoParaJanela(b).telas.administracao, 'NENHUM'); assert.equal(sessaoParaJanela(b).telas.testes, 'USAR', 'o papel continua valendo nas telas de trabalho');
  await codigo(() => conferirAcessoAoCanal('usuarios:listar', b), /^PERMISSION_DENIED: a tela Administração é só para contas marcadas como admin/);
  await entrarComo(b, comMarca, 'qa.dev');
  assert.equal(sessaoParaJanela(b).telas.administracao, 'USAR'); assert.doesNotThrow(() => conferirAcessoAoCanal('usuarios:listar', b));
});

test('marcar e desmarcar pela Administração; ninguém tira a própria marca nem a do último admin', async (t) => {
  const b = pasta(t); const eu = (await criarPrimeiraConta(ADMIN, b)).conta;
  const outra = await criarContaPelaAdministracao({ login: 'leitora', nome: 'Leitora', papel: 'leitor' }, b);
  assert.equal(alterarContaPelaAdministracao({ id: outra.conta.id, admin: true }, b).admin, true);
  assert.equal(alterarContaPelaAdministracao({ id: outra.conta.id, admin: false }, b).admin, false);
  await codigo(() => alterarContaPelaAdministracao({ id: eu.id, admin: false }, b), /^SELF_DEMOTE/);
  assert.equal(alterarContaPelaAdministracao({ id: eu.id, papel: 'qa' }, b).admin, true, 'trocar o próprio papel não tira a marca');
  assert.equal(listarContasDeAcesso(b).contas.find((c) => c.id === eu.id).admin, true);
});

test('conta antiga sem a marca gravada segue o papel Administrador e não perde o acesso', () => {
  assert.equal(ehAdmin({ papel: 'administrador' }), true);
  assert.equal(ehAdmin({ papel: 'qa' }), false);
  assert.equal(ehAdmin({ papel: 'administrador', admin: false }), false, 'a marca gravada vale mais que o papel');
});

test('cadastro pela tela de entrada nasce sem a marca e não vê a Administração', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  salvarConfiguracaoDeAcesso({ cadastroAberto: true, aprovarCadastros: false, papelDoCadastro: 'qa', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b);
  sairDaConta(b); await cadastrarComEmail({ login: 'nova', nome: 'Nova', senha: 'Senha-forte-2026' }, b); await entrarNaConta({ login: 'nova', senha: 'Senha-forte-2026' }, b);
  assert.equal(sessaoParaJanela(b).usuario.admin, false); assert.equal(sessaoParaJanela(b).telas.administracao, 'NENHUM');
});
