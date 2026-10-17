// Login, cadastro por e-mail, senha nova pelo e-mail, bloqueio, gestão de contas e permissão por canal, nas regras do núcleo (sem janela).
// O código por e-mail vem de um envio em memória (testes/apoio/contas-por-email.mjs): nada sai do processo.
// Cada teste usa uma pasta de dados temporária própria; nada toca a pasta da pessoa nem SQLite.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { alterarMinhasDuasEtapas, ativarLogin, cadastrarConta, confirmarEntrada, entrarNaConta, reenviarCodigoDeEntrada, recuperarConta, sairDaConta, trocarMinhaSenha } from '../../../../dist/login/regras/contas.js';
import { pedirCodigo } from '../../../../dist/login/regras/codigosPorEmail.js';
import { cadastrarComEmail, codigoPara, criarPrimeiraConta } from '../../../apoio/contas-por-email.mjs';
import { alterarContaPelaAdministracao, criarContaPelaAdministracao, desbloquearConta, excluirConta, listarContasDeAcesso, redefinirSenhaPelaAdministracao } from '../../../../dist/administracao/regras/gestaoDeContas.js';
import { excluirPapel, salvarConfiguracaoDeAcesso, salvarPapel } from '../../../../dist/administracao/regras/papeis.js';
import { conferirAcessoAoCanal } from '../../../../dist/login/regras/conferirAcessoAoCanal.js';
import { encerrarSessao, sessaoParaJanela } from '../../../../dist/login/regras/sessao.js';
import { conferirForcaDaSenha } from '../../../../dist/login/regras/senhas.js';
import { acessoDosCanais } from '../../../../dist/login/tipos/acessoDosCanais.js';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

const pasta = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-contas-')); t.after(() => { encerrarSessao(); fs.rmSync(d, { recursive: true, force: true }); }); return d; };
const ADMIN = { email: 'ana.admin@prumo.test', login: 'ana.admin', nome: 'Ana Admin', senha: 'Prumo-admin-2026' };
const codigo = async (fn, padrao) => { await assert.rejects(fn, (e) => { assert.match(e.message, padrao); return true; }); };

test('sem conta o Prumo não abre: só o primeiro acesso atende (criar a conta ou configurar GitHub/Google para criá-la); entrar e cadastrar recusam', async (t) => {
  const b = pasta(t);
  assert.equal(sessaoParaJanela(b).loginAtivo, false); assert.equal(sessaoParaJanela(b).usuario, null);
  assert.ok(Object.values(sessaoParaJanela(b).telas).every((n) => n === 'NENHUM'), 'nenhuma tela é liberada sem conta');
  for (const canal of ['usuarios:listar', 'agentes:salvar', 'dados:excluir', 'espacos:criar', 'espacos:listar', 'servicos:listar']) await codigo(async () => conferirAcessoAoCanal(canal, b), /^LOGIN_SETUP_REQUIRED/);
  for (const canal of ['usuarios:ativar', 'acesso:github', 'acesso:google', 'conta:sessao', 'conta:codigo', 'site:abrir']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  await codigo(() => entrarNaConta({ login: 'x', senha: 'y' }, b), /^LOGIN_NOT_ACTIVE/);
  await codigo(() => cadastrarConta({ email: 'novo@prumo.test', nome: 'Novo', senha: 'Senha-forte-123', codigo: '123456' }, b), /^LOGIN_NOT_ACTIVE/);
  await codigo(() => pedirCodigo({ email: 'novo@prumo.test', finalidade: 'SENHA' }, b, async () => assert.fail('sem conta não envia')), /^LOGIN_NOT_ACTIVE/);
  assert.equal(fs.existsSync(path.join(b, 'plataforma', 'acessos.json')), false, 'consultar não cria o arquivo');
});

test('primeira conta: o e-mail confirmado pelo código cria o administrador, guarda só resumos e já abre a sessão; não ativa duas vezes', async (t) => {
  const b = pasta(t);
  const codigoCerto = await codigoPara(ADMIN.email, 'CADASTRO', b); const errado = codigoCerto === '000000' ? '111111' : '000000';
  await codigo(() => ativarLogin({ email: ADMIN.email, nome: ADMIN.nome, senha: ADMIN.senha, codigo: errado }, b), /^CODE_INVALID/);
  await codigo(() => ativarLogin({ email: ADMIN.email, nome: ADMIN.nome, senha: 'curta1', codigo: codigoCerto }, b), /^PASSWORD_WEAK/, 'dado errado não gasta o código');
  const r = await ativarLogin({ email: ' Ana.Admin@Prumo.test ', nome: ADMIN.nome, senha: ADMIN.senha, codigo: codigoCerto }, b);
  assert.equal(r.codigoRecuperacao, undefined, 'não existe mais código de recuperação');
  assert.equal(r.conta.papel, 'administrador'); assert.equal(r.conta.email, 'ana.admin@prumo.test'); assert.equal(sessaoParaJanela(b).usuario.login, 'ana.admin');
  const bruto = fs.readFileSync(path.join(b, 'plataforma', 'acessos.json'), 'utf8');
  assert.ok(!bruto.includes(ADMIN.senha) && !bruto.includes('"' + codigoCerto + '"'), 'senha e código nunca em texto claro');
  assert.match(bruto, /"algoritmo":"scrypt"/);
  await codigo(() => ativarLogin({ email: 'outra@prumo.test', nome: 'Outra', senha: ADMIN.senha, codigo: codigoCerto }, b), /^LOGIN_ALREADY_ACTIVE/);
});

test('senha fraca é recusada com o motivo', () => {
  for (const [senha, motivo] of [['curta1', /10 caracteres/], ['somenteletrasaqui', /letras e números/], ['ana.admin12345', /login/], ['1a1a1a1a1a1a', /variados/]]) assert.throws(() => conferirForcaDaSenha(senha, 'ana.admin'), (e) => motivo.test(e.message) && /^PASSWORD_WEAK/.test(e.message));
  assert.doesNotThrow(() => conferirForcaDaSenha('Prumo-admin-2026', 'outra'));
});

test('entrar: com e-mail ou login; mesma mensagem para conta inexistente e senha errada; bloqueia no limite; desbloqueio pela Administração', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  const { senhaTemporaria } = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  sairDaConta(b);
  await codigo(() => entrarNaConta({ login: 'ninguem', senha: 'qualquer-1234' }, b), /^LOGIN_INVALID: login ou senha incorretos/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^LOGIN_INVALID: login ou senha incorretos/);
  for (let i = 0; i < 3; i++) await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^LOGIN_INVALID/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: 'errada-1234' }, b), /^ACCOUNT_LOCKED/);
  await codigo(() => entrarNaConta({ login: 'bruno', senha: senhaTemporaria }, b), /^ACCOUNT_LOCKED/);
  assert.equal((await entrarNaConta({ login: ' ANA.ADMIN@prumo.test', senha: ADMIN.senha }, b)).usuario.login, 'ana.admin', 'entra pelo e-mail');
  const bruno = listarContasDeAcesso(b).contas.find((c) => c.login === 'bruno'); assert.equal(bruno.bloqueada, true);
  desbloquearConta(bruno.id, b); sairDaConta(b);
  const s = await entrarNaConta({ login: 'BRUNO ', senha: senhaTemporaria }, b);
  assert.equal(s.usuario.login, 'bruno'); assert.equal(s.usuario.trocarSenha, true);
});

test('senha temporária: só sair e trocar a senha até definir a própria', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  const { senhaTemporaria } = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  sairDaConta(b); await entrarNaConta({ login: 'bruno', senha: senhaTemporaria }, b);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b), /^Error: PASSWORD_CHANGE_REQUIRED/);
  assert.doesNotThrow(() => conferirAcessoAoCanal('conta:senha', b));
  await codigo(() => trocarMinhaSenha({ atual: 'errada-123456', nova: 'Chave-nova-2026' }, b), /^PASSWORD_INVALID/);
  const r = await trocarMinhaSenha({ atual: senhaTemporaria, nova: 'Chave-nova-2026' }, b);
  assert.equal(r.codigoRecuperacao, undefined); assert.equal(r.sessao.usuario.trocarSenha, false);
  assert.doesNotThrow(() => conferirAcessoAoCanal('espacos:criar', b));
});

test('permissão por canal: qa não entra na Administração; leitor consulta mas não altera; sem sessão nada além do público', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  const qa = await criarContaPelaAdministracao({ login: 'bruno', nome: 'Bruno QA', papel: 'qa' }, b);
  const leitor = await criarContaPelaAdministracao({ login: 'carla', nome: 'Carla Leitora', papel: 'leitor' }, b);
  sairDaConta(b);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b), /SESSION_REQUIRED/);
  for (const canal of ['conta:sessao', 'conta:entrar', 'conta:cadastrar', 'conta:codigo', 'conta:recuperar', 'conta:githubestado', 'app:info', 'site:abrir']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  for (const canal of ['acesso:github', 'acesso:google', 'usuarios:ativar']) assert.throws(() => conferirAcessoAoCanal(canal, b), /SESSION_REQUIRED/, 'com conta criada, configurar o provedor volta a ser só da Administração');
  const entrarCom = async (login, temporaria, nova) => { await entrarNaConta({ login, senha: temporaria }, b); await trocarMinhaSenha({ atual: temporaria, nova }, b); };
  await entrarCom('bruno', qa.senhaTemporaria, 'Chave-nova-2026');
  for (const canal of ['usuarios:listar', 'usuarios:criar', 'papeis:salvar', 'plataforma:salvar', 'agentes:salvar', 'dados:excluir', 'administracao:mapa']) assert.throws(() => conferirAcessoAoCanal(canal, b), /PERMISSION_DENIED: a tela Administração é só para contas marcadas como admin/);
  for (const canal of ['espacos:criar', 'contextos:salvar', 'runs:executar', 'conhecimento:criar']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  sairDaConta(b); await entrarCom('carla', leitor.senhaTemporaria, 'Leitura-firme-26');
  for (const canal of ['contextos:listar', 'runs:listar', 'projeto:logs']) assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b));
  for (const canal of ['contextos:salvar', 'espacos:criar', 'runs:executar', 'agenda:salvar']) assert.throws(() => conferirAcessoAoCanal(canal, b), /PERMISSION_DENIED: o papel Leitor não permite alterar/);
  assert.equal(sessaoParaJanela(b).telas.administracao, 'NENHUM'); assert.equal(sessaoParaJanela(b).telas.testes, 'VER');
});

test('papel alterado, conta desativada e sessão vencida valem no próximo pedido', async (t) => {
  const b = pasta(t); const agora = Date.now(); await criarPrimeiraConta(ADMIN, b, new Date(agora));
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

test('cadastro por e-mail: fechado, pendente até aprovar, nunca como administrador; senha nova pelo código do e-mail', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b);
  salvarConfiguracaoDeAcesso({ cadastroAberto: true, aprovarCadastros: true, papelDoCadastro: 'leitor', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b);
  const DANI = { email: 'dani@prumo.test', nome: 'Dani Dev', senha: 'Cadastro-firme-26' };
  const novo = await cadastrarComEmail(DANI, b);
  assert.deepEqual(novo, { estado: 'PENDENTE' }, 'sem código de recuperação');
  await codigo(() => pedirCodigo({ email: 'DANI@prumo.test', finalidade: 'CADASTRO' }, b, async () => assert.fail('não envia')), /^EMAIL_TAKEN/);
  await codigo(() => cadastrarConta({ ...DANI, nome: 'Outra', codigo: '123456' }, b), /^EMAIL_TAKEN/);
  sairDaConta(b); await codigo(() => entrarNaConta({ login: 'dani@prumo.test', senha: DANI.senha }, b), /^ACCOUNT_PENDING/);
  await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b);
  const dani = listarContasDeAcesso(b).contas.find((c) => c.email === 'dani@prumo.test'); assert.equal(dani.papel, 'leitor'); assert.equal(dani.login, 'dani');
  alterarContaPelaAdministracao({ id: dani.id, estado: 'ATIVO' }, b);
  assert.throws(() => salvarConfiguracaoDeAcesso({ cadastroAberto: true, aprovarCadastros: false, papelDoCadastro: 'administrador', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b), /SIGNUP_ROLE_FORBIDDEN/);
  salvarConfiguracaoDeAcesso({ cadastroAberto: false, aprovarCadastros: true, papelDoCadastro: 'leitor', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15 }, b);
  await codigo(() => pedirCodigo({ email: 'eva@prumo.test', finalidade: 'CADASTRO' }, b, async () => assert.fail('não envia')), /^SIGNUP_CLOSED/);
  await codigo(() => cadastrarConta({ email: 'eva@prumo.test', nome: 'Eva', senha: 'Fechado-firme-26', codigo: '123456' }, b), /^SIGNUP_CLOSED/);
  sairDaConta(b);
  // E-mail sem conta: nada é enviado, a resposta é igual e o código digitado nunca vale.
  let enviados = 0; const semConta = await pedirCodigo({ email: 'ninguem@prumo.test', finalidade: 'SENHA' }, b, async () => { enviados++; });
  assert.equal(enviados, 0); assert.deepEqual(Object.keys(semConta).sort(), ['email', 'minutosDeValidade', 'segundosParaReenviar']);
  await codigo(() => recuperarConta({ email: 'ninguem@prumo.test', codigo: '123456', novaSenha: 'Recupera-firme-26' }, b), /^CODE_INVALID/);
  const certo = await codigoPara('dani@prumo.test', 'SENHA', b);
  await codigo(() => recuperarConta({ email: 'dani@prumo.test', codigo: certo === '000000' ? '111111' : '000000', novaSenha: 'Recupera-firme-26' }, b), /^CODE_INVALID/);
  assert.deepEqual(await recuperarConta({ email: 'Dani@Prumo.test', codigo: certo, novaSenha: 'Recupera-firme-26' }, b), { redefinida: true });
  await codigo(() => recuperarConta({ email: 'dani@prumo.test', codigo: certo, novaSenha: 'Outra-chave-2026' }, b), /^CODE_EXPIRED/, 'código usado deixa de valer');
  assert.equal((await entrarNaConta({ login: 'dani@prumo.test', senha: 'Recupera-firme-26' }, b)).usuario.login, 'dani');
});

test('Administração: sempre sobra um administrador ativo e ninguém se desativa, se rebaixa ou se exclui', async (t) => {
  const b = pasta(t); const { conta: eu } = await criarPrimeiraConta(ADMIN, b);
  await codigo(async () => alterarContaPelaAdministracao({ id: eu.id, estado: 'DESATIVADO' }, b), /^SELF_DISABLE/);
  await codigo(async () => alterarContaPelaAdministracao({ id: eu.id, admin: false }, b), /^SELF_DEMOTE/); // 2.15.1: a Administração vem da marca admin, não do papel
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

test('todo canal da janela tem tela e nível definidos; os públicos são só os da entrada (inclusive o site oficial)', () => {
  assert.deepEqual(Object.keys(acessoDosCanais).sort(), Object.keys(esquemasIpc).sort());
  assert.deepEqual(Object.entries(acessoDosCanais).filter(([, v]) => v === 'publico').map(([k]) => k).sort(), ['app:info', 'conta:cadastrar', 'conta:codigo', 'conta:confirmarentrada', 'conta:entrar', 'conta:githubestado', 'conta:githubiniciar', 'conta:googleestado', 'conta:googleiniciar', 'conta:recuperar', 'conta:reenviarentrada', 'conta:sessao', 'preferencias:obter', 'site:abrir']);
  for (const canal of ['usuarios:criar', 'usuarios:alterar', 'usuarios:senha', 'papeis:salvar', 'acesso:salvar', 'plataforma:salvar', 'agentes:salvar', 'skills:importar', 'dados:excluir', 'atualizacao:instalar']) assert.deepEqual(acessoDosCanais[canal], ['administracao', 'USAR'], canal);
});


test('consultas automáticas do painel não prolongam a sessão, mas interação humana prolonga', async (t) => {
  const b = pasta(t); const agora = Date.now(); await criarPrimeiraConta(ADMIN, b, new Date(agora));
  for (const canal of ['assistente:agentes', 'conversas:listar', 'worker:estado']) {
    assert.doesNotThrow(() => conferirAcessoAoCanal(canal, b, agora + 10 * 60_000, false), canal);
  }
  assert.throws(() => conferirAcessoAoCanal('assistente:agentes', b, agora + 31 * 60_000, false), /SESSION_EXPIRED/);
  await entrarNaConta({ login: ADMIN.login, senha: ADMIN.senha }, b, new Date(agora));
  assert.doesNotThrow(() => conferirAcessoAoCanal('espacos:criar', b, agora + 25 * 60_000, true));
  assert.doesNotThrow(() => conferirAcessoAoCanal('assistente:agentes', b, agora + 40 * 60_000, false));
});

test('duas etapas: com a opção ligada, a senha certa não abre a sessão; só o código do e-mail abre, uma vez, e erros contam para o bloqueio', async (t) => {
  const b = pasta(t); await criarPrimeiraConta(ADMIN, b); const caixa = []; const enviar = async (p) => { caixa.push(p); };
  await codigo(() => alterarMinhasDuasEtapas({ ligar: true, senha: 'errada-123456' }, b), /^PASSWORD_INVALID/);
  assert.equal((await alterarMinhasDuasEtapas({ ligar: true, senha: ADMIN.senha }, b)).usuario.duasEtapas, true);
  sairDaConta(b);
  const e = await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b, new Date(), enviar);
  assert.equal(e.duasEtapas, true); assert.equal(e.email, 'a***@prumo.test'); assert.equal(sessaoParaJanela(b).usuario, null, 'a senha sozinha não abre a sessão');
  assert.deepEqual(caixa.map((x) => [x.finalidade, x.email]), [['ENTRADA', 'ana.admin@prumo.test']]);
  assert.throws(() => conferirAcessoAoCanal('espacos:listar', b), /SESSION_REQUIRED/);
  const certo = caixa[0].codigo; const errado = certo === '000000' ? '111111' : '000000';
  await codigo(() => confirmarEntrada({ desafio: e.desafio, codigo: errado }, b), /^CODE_INVALID/);
  await codigo(() => confirmarEntrada({ desafio: '00000000-0000-4000-8000-000000000000', codigo: certo }, b), /^CODE_EXPIRED/, 'desafio inventado não serve');
  await codigo(() => reenviarCodigoDeEntrada({ desafio: e.desafio }, new Date(), enviar), /^EMAIL_WAIT/);
  assert.equal((await confirmarEntrada({ desafio: e.desafio, codigo: certo }, b)).usuario.login, 'ana.admin');
  await codigo(() => confirmarEntrada({ desafio: e.desafio, codigo: certo }, b), /^CODE_EXPIRED/, 'uso único');
  // A Administração exige para todas as contas com e-mail; conta sem e-mail (criada pela Administração) entra só com a senha.
  const bia = await criarContaPelaAdministracao({ login: 'bia', nome: 'Bia', papel: 'qa' }, b);
  salvarConfiguracaoDeAcesso({ cadastroAberto: true, aprovarCadastros: false, papelDoCadastro: 'leitor', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15, exigirDuasEtapas: true }, b);
  await alterarMinhasDuasEtapas({ ligar: false, senha: ADMIN.senha }, b); sairDaConta(b);
  assert.equal((await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b, new Date(Date.now() + 61_000), enviar)).duasEtapas, true, 'exigida pela Administração, mesmo desligada na conta');
  const sb = await entrarNaConta({ login: 'bia', senha: bia.senhaTemporaria }, b, new Date(), enviar); assert.equal(sb.usuario.login, 'bia', 'sem e-mail entra só com a senha');
  await codigo(() => alterarMinhasDuasEtapas({ ligar: true, senha: bia.senhaTemporaria }, b), /^TWO_STEP_EMAIL_REQUIRED/);
  // Cinco códigos errados bloqueiam a conta, como senha errada.
  sairDaConta(b); const outra = await entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b, new Date(Date.now() + 130_000), enviar); const bom = caixa.at(-1).codigo; const ruim = bom === '000000' ? '111111' : '000000';
  let ultimo; for (let i = 0; i < 5; i++) { try { await confirmarEntrada({ desafio: outra.desafio, codigo: ruim }, b); } catch (x) { ultimo = x.message; } }
  assert.match(ultimo, /^(ACCOUNT_LOCKED|CODE_EXPIRED)/);
  await codigo(() => entrarNaConta({ login: 'ana.admin', senha: ADMIN.senha }, b, new Date(Date.now() + 200_000), enviar), /^ACCOUNT_LOCKED/);
});
