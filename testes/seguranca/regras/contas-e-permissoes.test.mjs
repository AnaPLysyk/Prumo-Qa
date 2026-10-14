// Login, cadastro, recuperação, bloqueio, gestão de contas e permissão por canal, nas regras do núcleo (sem janela).
// Cada teste usa uma pasta de dados temporária própria; nada toca a pasta da pessoa nem SQLite.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ativarLogin, cadastrarConta, entrarNaConta, recuperarConta, sairDaConta, trocarMinhaSenha } from '../../../dist/administracao/regras/contas.js';
import { alterarContaPelaAdministracao, criarContaPelaAdministracao, desbloquearConta, excluirConta, listarContasDeAcesso, redefinirSenhaPelaAdministracao } from '../../../dist/administracao/regras/gestaoDeContas.js';
import { excluirPapel, salvarConfiguracaoDeAcesso, salvarPapel } from '../../../dist/administracao/regras/papeis.js';
import { conferirAcessoAoCanal } from '../../../dist/administracao/regras/conferirAcessoAoCanal.js';
import { encerrarSessao, sessaoParaJanela } from '../../../dist/administracao/regras/sessao.js';
import { conferirForcaDaSenha } from '../../../dist/administracao/regras/senhas.js';
import { acessoDosCanais } from '../../../dist/administracao/tipos/acessoDosCanais.js';
import { esquemasIpc } from '../../../dist/aplicativo/api/catalogoDeContratos.js';

const pasta = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-contas-')); t.after(() => { encerrarSessao(); fs.rmSync(d, { recursive: true, force: true }); }); return d; };
const ADMIN = { login: 'ana.admin', nome: 'Ana Admin', senha: 'Prumo-admin-2026' };
const codigo = async (fn, padrao) => { await assert.rejects(fn, (e) => { assert.match(e.message, padrao); return true; }); };

test('sem conta o login fica desligado: todos os canais atendem e entrar/cadastrar recusam', async (t) => {
  const b = pasta(t);
  assert.equal(sessaoParaJanela(b).loginAtivo, false);
  for (const canal of ['usuarios:listar', 'agentes:salvar', 'dados:excluir', 'espacos:criar']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  await codigo(() => entrarNaConta({ login: 'x', senha: 'y' }, b), /^LOGIN_NOT_ACTIVE/);
  await codigo(() => cadastrarConta({ login: 'novo', nome: 'Novo', senha: 'Senha-forte-123' }, b), /^LOGIN_NOT_ACTIVE/);
  assert.equal(fs.existsSync(path.join(b, 'plataforma', 'acessos.json')), false, 'consultar não cria o arquivo');
});

test('ativar o login cria o administrador, guarda só resumos e já abre a sessão; não ativa duas vezes', async (t) => {
  const b = pasta(t);
  const r = await ativarLogin(ADMIN, b);
  assert.match(r.codigoRecuperacao, /^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}$/);
  assert.equal(r.conta.papel, 'administrador'); assert.equal(sessaoParaJanela(b).usuario.login, 'ana.admin');
  const bruto = fs.readFileSync(path.join(b, 'plataforma', 'acessos.json'), 'utf8');
  assert.ok(!bruto.includes(ADMIN.senha) && !bruto.includes(r.codigoRecuperacao) && !bruto.includes(r.codigoRecuperacao.replaceAll('-', '')), 'senha e código nunca em texto claro');
  assert.match(bruto, /"algoritmo":"scrypt"/);
  await codigo(() => ativarLogin({ ...ADMIN, login: 'outra' }, b), /^LOGIN_ALREADY_ACTIVE/);
});

test('senha fraca é recusada com o motivo', () => {
  for (const [senha, motivo] of [['curta1', /10 caracteres/], ['somenteletrasaqui', /letras e números/], ['ana.admin12345', /login/], ['1a1a1a1a1a1a', /variados/]]) assert.throws(() => conferirForcaDaSenha(senha, 'ana.admin'), (e) => motivo.test(e.message) && /^PASSWORD_WEAK/.test(e.message));
  assert.doesNotThrow(() => conferirForcaDaSenha('Prumo-admin-2026', 'outra'));
});

test('entrar: mesma mensagem para login inexistente e senha errada; bloqueia no limite; desbloqueio pela Administração', async (t) => {
  const b = pasta(t); await ativarLogin(ADMIN, b);
  const { senhaTemporaria } = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  sairDaConta(b);
  await codigo(() => entrarNaConta({ login: 'ninguem', senha: 'qualquer-1234' }, b), /^LOGIN_INVALID: login ou senha incorretos/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^LOGIN_INVALID: login ou senha incorretos/);
  for (let i = 0; i < 3; i++) await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^LOGIN_INVALID/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^ACCOUNT_LOCKED/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: senhaTemporaria }, b), /^ACCOUNT_LOCKED/);
  await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b);
  const bruno = listarContasDeAcesso(b).contas.find((c) => c.login === 'bruno'); assert.equal(bruno.bloqueada, true);
  desbloquearConta(bruno.id, b); sairDaConta(b);
  const s = await entrarNaConta({ login: 'BRUNO ', senha: senhaTemporaria }, b);
  assert.equal(s.usuario.login, 'bruno'); assert.equal(s.usuario.trocarSenha, true);
});

test('senha temporária: só sair e trocar a senha até definir a própria; a troca gera código de recuperação', async (t) => {
  const b = pasta(t); await ativarLogin(ADMIN, b);
  const { senhaTemporaria } = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  sairDaConta(b); await entrarNaConta({ login: 'bruno', senha: senhaTemporaria }, b);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b), /^Error: PASSWORD_CHANGE_REQUIRED/);
  assert.doesNotThrow(() => conferirAcessoAoCanal('conta:senha', b));
  await codigo(() => trocarMinhaSenha({ atual: 'errada-123456', nova: 'Chave-nova-2026' }, b), /^PASSWORD_INVALID/);
  const r = await trocarMinhaSenha({ atual: senhaTemporaria, nova: 'Chave-nova-2026' }, b);
  assert.match(r.codigoRecuperacao, /^[A-Z2-7]{5}-/); assert.equal(r.sessao.usuario.trocarSenha, false);
  assert.doesNotThrow(() => conferirAcessoAoCanal('espacos:criar', b));
});

test('permissão por canal: qa não entra na Administração; leitor consulta mas não altera; sem sessão nada além do público', async (t) => {
  const b = pasta(t); await ativarLogin(ADMIN, b);
  const qa = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  const leitor = await criarContaPelaAdministracao({ login: 'carla', nome: 'Carla Leitora', papel: 'leitor' }, b);
  sairDaConta(b);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b), /SESSION_REQUIRED/);
  for (const canal of ['conta:sessao', 'conta:entrar', 'conta:cadastrar', 'conta:recuperar', 'app:info']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  const entrarCom = async (login, temporaria, nova) => { await entrarNaConta({ login, senha: temporaria }, b); await trocarMinhaSenha({ atual: temporaria, nova }, b); };
  await entrarCom('bruno', qa.senhaTemporaria, 'Chave-nova-2026');
  for (const canal of ['usuarios:listar', 'usuarios:criar', 'papeis:salvar', 'plataforma:salvar', 'agentes:salvar', 'dados:excluir', 'administracao:mapa']) assert.throws(() => conferirAcessoAoCanal(canal, b), /PERMISSION_DENIED: o papel Analista de QA não permite/);
  for (const canal of ['espacos:criar', 'contextos:salvar', 'runs:executar', 'conhecimento:criar']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  sairDaConta(b); await entrarCom('carla', leitor.senhaTemporaria, 'Leitura-firme-26');
  for (const canal of ['contextos:listar', 'runs:listar', 'projeto:logs']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  for (const canal of ['contextos:salvar', 'espacos:criar', 'runs:executar', 'agenda:salvar']) assert.throws(() => conferirAcessoAoCanal(canal, b), /PERMISSION_DENIED: o papel Leitor não permite alterar/);
  assert.equal(sessaoParaJanela(b).telas.administracao, 'NENHUM'); assert.equal(sessaoParaJanela(b).telas.testes, 'VER');
});

test('papel alterado, conta desativada e sessão vencida valem no próximo pedido', async (t) => {
  const b = pasta(t); const agora = Date.now(); await ativarLogin(ADMIN, b, new Date(agora));
  const qa = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  const papel = salvarPapel({ nome: 'Só Testes', descricao: 'Vê testes', telas: { testes: 'VER' } }, b).papeis.find((p) => p.nome === 'Só Testes');
  assert.equal(papel.telas.projetos, 'NENHUM', 'tela não informada fica sem acesso');
  alterarContaPelaAdministracao({ id: qa.conta.id, papel: papel.id }, b);
  sairDaConta(b); await entrarNaConta({ login: 'bruno', senha: qa.senhaTemporaria }, b); await trocarMinhaSenha({ atual: qa.senhaTemporaria, nova: 'Chave-nova-2026' }, b);
  assert.doesNotThrow(() => conferirAcessoAoCanal('testes:catalogo', b));
  assert.throws(() => conferirAcessoAoCanal('contextos:listar', b), /PERMISSION_DENIED/);
  // Desativada por outro administrador: o próximo pedido já não tem sessão.
  sairDaConta(b); await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b);
  alterarContaPelaAdministracao({ id: qa.conta.id, estado: 'DESATIVADO' }, b);
  sairDaConta(b); await codigo(() => entrarNaConta({ login: 'bruno', senha: 'Chave-nova-2026' }, b), /^ACCOUNT_DISABLED/);
  // Inatividade: 30 minutos por padrão.
  await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b, new Date(agora));
  assert.doesNotThrow(() => conferirAcessoAoCanal('espacos:listar', b, agora + 29 * 60_000));
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b, agora + 29 * 60_000 + 31 * 60_000), /SESSION_EXPIRED/);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b, agora + 61 * 60_000), /SESSION_REQUIRED/);
});

test('cadastro: fechado, pendente até aprovar, nunca como administrador; recuperação troca o código', async (t) => {
  const b = pasta(t); await ativarLogin(ADMIN, b);
  const novo = await cadastrarConta({ login: 'dani', nome: 'Dani Dev', senha: 'Cadastro-firme-26' }, b);
  assert.equal(novo.estado, 'PENDENTE');
  await codigo(() => cadastrarConta({ login: 'dani', nome: 'Outra', senha: 'Segunda-chave-26' }, b), /^LOGIN_TAKEN/);
  sairDaConta(b); await codigo(() => entrarNaConta({ login: 'dani', senha: 'Cadastro-firme-26' }, b), /^ACCOUNT_PENDING/);
  await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b);
  const dani = listarContasDeAcesso(b).contas.find((c) => c.login === 'dani'); assert.equal(dani.papel, 'leitor');
  alterarContaPelaAdministracao({ id: dani.id, estado: 'ATIVO' }, b);
  assert.throws(() => salvarConfiguracaoDeAcesso({ cadastroAberto: true, aprovarCadastros: false, papelDoCadastro: 'administrador', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b), /SIGNUP_ROLE_FORBIDDEN/);
  salvarConfiguracaoDeAcesso({ cadastroAberto: false, aprovarCadastros: true, papelDoCadastro: 'leitor', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b);
  await codigo(() => cadastrarConta({ login: 'eva', nome: 'Eva', senha: 'Fechado-firme-26' }, b), /^SIGNUP_CLOSED/);
  sairDaConta(b);
  await codigo(() => recuperarConta({ login: 'dani', codigo: 'AAAAA-AAAAA-AAAAA-AAAAA', novaSenha: 'Recupera-firme-26' }, b), /^RECOVERY_INVALID/);
  const r = await recuperarConta({ login: 'dani', codigo: novo.codigoRecuperacao.toLowerCase(), novaSenha: 'Recupera-firme-26' }, b);
  assert.notEqual(r.codigoRecuperacao, novo.codigoRecuperacao);
  await codigo(() => recuperarConta({ login: 'dani', codigo: novo.codigoRecuperacao, novaSenha: 'Outra-chave-2026' }, b), /^RECOVERY_INVALID/, 'código usado deixa de valer');
  assert.equal((await entrarNaConta({ login: 'dani', senha: 'Recupera-firme-26' }, b)).usuario.login, 'dani');
});

test('Administração: sempre sobra um administrador ativo e ninguém se desativa, se rebaixa ou se exclui', async (t) => {
  const b = pasta(t); const { conta: eu } = await ativarLogin(ADMIN, b);
  await codigo(async () => alterarContaPelaAdministracao({ id: eu.id, estado: 'DESATIVADO' }, b), /^SELF_DISABLE/);
  await codigo(async () => alterarContaPelaAdministracao({ id: eu.id, papel: 'qa' }, b), /^SELF_DEMOTE/);
  await codigo(async () => excluirConta(eu.id, b), /^SELF_DELETE/);
  await codigo(() => redefinirSenhaPelaAdministracao(eu.id, b), /^USE_MY_ACCOUNT/);
  const outro = await criarContaPelaAdministracao({ login: 'bia', nome: 'Bia', papel: 'qa' }, b);
  await codigo(async () => excluirConta(outro.conta.id, b), /^ACCOUNT_ACTIVE/);
  await codigo(async () => excluirPapel('qa', b), /^ROLE_IN_USE/);
  await codigo(async () => salvarPapel({ id: 'administrador', nome: 'Administrador', telas: {} }, b), /^ROLE_FIXED/);
  const nova = await redefinirSenhaPelaAdministracao(outro.conta.id, b);
  assert.notEqual(nova.senhaTemporaria, outro.senhaTemporaria); assert.equal(nova.conta.trocarSenha, true);
  alterarContaPelaAdministracao({ id: outro.conta.id, estado: 'DESATIVADO' }, b); excluirConta(outro.conta.id, b);
  assert.deepEqual(listarContasDeAcesso(b).contas.map((c) => c.login), ['ana.admin']);
  assert.ok(!JSON.stringify(listarContasDeAcesso(b)).includes('"senha"') && !JSON.stringify(listarContasDeAcesso(b)).includes('resumo'), 'a janela nunca recebe resumos');
});

test('todo canal da janela tem tela e nível definidos; os de conta pública são só os da entrada', () => {
  assert.deepEqual(Object.keys(acessoDosCanais).sort(), Object.keys(esquemasIpc).sort());
  assert.deepEqual(Object.entries(acessoDosCanais).filter(([, v]) => v === 'publico').map(([k]) => k).sort(), ['app:info', 'conta:cadastrar', 'conta:entrar', 'conta:recuperar', 'conta:sessao', 'preferencias:obter']);
  for (const canal of ['usuarios:criar', 'usuarios:alterar', 'usuarios:senha', 'papeis:salvar', 'acesso:salvar', 'plataforma:salvar', 'agentes:salvar', 'skills:importar', 'dados:excluir', 'atualizacao:instalar']) assert.deepEqual(acessoDosCanais[canal], ['administracao', 'USAR'], canal);
});
