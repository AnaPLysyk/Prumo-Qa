/** Contas conectadas pelo navegador (GitHub App e Jira OAuth): cofre, renovação do acesso, destino Jira por api.atlassian.com e vínculo desativado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { adicionarContaOAuth, adaptadorDaConta, contaAtivaRenovada, trocarToken, verificarVinculoDoServico } from '../../../../dist/conexoes/servicoContas.js';
import { cofreCredenciais } from '../../../../dist/conexoes/banco/credenciais.js';
import { lerContasDeServico } from '../../../../dist/conexoes/banco/contasDeServico.js';
import { destinoDoPedido } from '../../../../dist/conexoes/integracoes/requisicoes.js';
import { criarEspaco, alternarVinculoServico } from '../../../../dist/projetos/servicoProjetos.js';
import { obterEspaco } from '../../../../dist/projetos/banco/projetos.js';

const NUVEM = '11111111-1111-4111-8111-111111111111';
const OUTRA = '22222222-2222-4222-8222-222222222222';
const SITE = 'https://empresa.atlassian.net';

const protetor = { disponivel: () => true, proteger: (s) => Buffer.from(s, 'utf8'), abrir: (b) => b.toString('utf8') };
const protetorIndisponivel = { disponivel: () => false, proteger: () => { throw new Error('sem cofre'); }, abrir: () => { throw new Error('sem cofre'); } };

function ambiente(t, { renovar, revogar, protegido = protetor, repositorios } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-oauth-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const pedidos = [];
  const transporte = async (p) => {
    pedidos.push(p);
    if (p.servico === 'github' && p.caminho === '/user') return { id: 4242, login: 'ana' };
    if (p.servico === 'github' && p.caminho.startsWith('/user/installations?')) return { installations: [{ id: 7 }, { id: 8 }] };
    if (p.servico === 'github' && p.caminho.startsWith('/user/installations/7/repositories')) return { repositories: repositorios?.[7] ?? [{ id: 11, full_name: 'org/zeta', name: 'zeta' }, { id: 12, full_name: 'org/alfa', name: 'alfa' }] };
    if (p.servico === 'github' && p.caminho.startsWith('/user/installations/8/repositories')) return { repositories: repositorios?.[8] ?? [{ id: 13, full_name: 'org/meio', name: 'meio' }] };
    if (p.servico === 'github' && p.caminho.startsWith('/repositories/')) return { id: 11, full_name: 'org/zeta', name: 'zeta' };
    if (p.servico === 'jira' && p.caminho === '/rest/api/3/myself') return { accountId: '70121:abc', displayName: 'Ana Souza' };
    if (p.servico === 'jira' && p.caminho.startsWith('/rest/api/3/project/')) return { id: '10000', key: 'APP', name: 'App' };
    throw new Error('pedido inesperado ' + p.caminho);
  };
  const cofre = cofreCredenciais(protegido, base);
  const c = { protetor: protegido, transporte, escrita: async () => ({}), base, cofre, renovar, revogar };
  return { base, c, pedidos, cofre };
}
const credencial = (extra = {}) => ({ acesso: 'ghu_acesso', renovacao: 'ghr_renovacao', expiraEm: Date.now() + 8 * 3600_000, ...extra });

test('GitHub: a conta nasce validada, o cofre guarda o JSON e o cadastro não leva nenhum token', async (t) => {
  const { c, cofre, base } = ambiente(t);
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial() });
  assert.equal(conta.autenticacao, 'oauth');
  assert.equal(conta.nome, 'GitHub · ana');
  assert.equal(conta.contaId, '4242');
  assert.equal(conta.instancia, 'https://api.github.com');
  assert.deepEqual(JSON.parse(cofre.ler(conta.id)).acesso, 'ghu_acesso');
  const arquivos = fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
  const cadastro = arquivos.find((x) => path.basename(x) === 'contas.json');
  assert.ok(cadastro, 'o cadastro das contas existe');
  for (const x of arquivos.filter((y) => path.basename(y) !== 'credenciais.json')) {
    const texto = fs.readFileSync(x, 'utf8');
    assert.ok(!texto.includes('ghu_acesso') && !texto.includes('ghr_renovacao'), 'token fora do cofre: ' + path.basename(x));
  }
  await assert.rejects(adicionarContaOAuth(c, { servico: 'github', credencial: credencial() }), /CONNECTION_DUPLICATE/);
});

test('sem cofre do sistema nada é guardado nem validado', async (t) => {
  const { c, pedidos, base } = ambiente(t, { protegido: protetorIndisponivel });
  await assert.rejects(adicionarContaOAuth(c, { servico: 'github', credencial: credencial() }), /CREDENTIAL_PROTECTION_UNAVAILABLE/);
  assert.equal(pedidos.length, 0);
  assert.equal(lerContasDeServico(base).contas.length, 0);
});

test('credencial malformada ou enorme é recusada antes de qualquer consulta', async (t) => {
  const { c, pedidos } = ambiente(t);
  await assert.rejects(adicionarContaOAuth(c, { servico: 'github', credencial: { acesso: '' } }));
  await assert.rejects(adicionarContaOAuth(c, { servico: 'github', credencial: { acesso: 'x'.repeat(4001) } }));
  await assert.rejects(adicionarContaOAuth(c, { servico: 'github', credencial: { acesso: 'a', extra: 'b' } }));
  assert.equal(pedidos.length, 0);
});

test('GitHub App: lista só os repositórios das instalações, em ordem, sem /user/repos', async (t) => {
  const { c, pedidos } = ambiente(t);
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial() });
  const lista = await adaptadorDaConta(c, conta).listar({ limite: 2 });
  assert.deepEqual(lista.recursos.map((r) => r.chave), ['org/alfa', 'org/meio']);
  assert.equal(lista.proxima, 2);
  assert.equal(lista.total, 3);
  assert.ok(!pedidos.some((p) => p.caminho.startsWith('/user/repos')));
  const segunda = await adaptadorDaConta(c, conta).listar({ offset: 2, limite: 2 });
  assert.deepEqual(segunda.recursos.map((r) => r.chave), ['org/zeta']);
  assert.equal(segunda.proxima, null);
  assert.equal(pedidos.find((p) => p.caminho === '/user').headers.Authorization, 'Bearer ghu_acesso');
});

test('GitHub App sem instalação: lista vazia, para a tela pedir a instalação', async (t) => {
  const { c } = ambiente(t, { repositorios: { 7: [], 8: [] } });
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial() });
  assert.equal((await adaptadorDaConta(c, conta).listar({ limite: 1 })).recursos.length, 0);
});

test('Jira OAuth: pedidos levam Bearer e o id do site; o cadastro guarda o site e a nuvem', async (t) => {
  const { c, pedidos } = ambiente(t);
  const conta = await adicionarContaOAuth(c, { servico: 'jira', nome: 'Jira · Empresa', instancia: SITE, nuvem: NUVEM, credencial: credencial({ acesso: 'jira_acesso', renovacao: 'jira_renovacao' }) });
  assert.equal(conta.instancia, SITE);
  assert.equal(conta.nuvem, NUVEM);
  assert.equal(conta.usuario, undefined);
  const pedido = pedidos.find((p) => p.caminho === '/rest/api/3/myself');
  assert.equal(pedido.nuvem, NUVEM);
  assert.equal(pedido.headers.Authorization, 'Bearer jira_acesso', 'OAuth não usa Basic com e-mail');
  assert.equal(pedido.instancia, SITE);
});

test('Jira OAuth exige site e nuvem válidos e só aceita endereço *.atlassian.net', async (t) => {
  const { c, pedidos } = ambiente(t);
  await assert.rejects(adicionarContaOAuth(c, { servico: 'jira', instancia: SITE, credencial: credencial() }), 'sem nuvem');
  await assert.rejects(adicionarContaOAuth(c, { servico: 'jira', nuvem: 'nao-e-uuid', instancia: SITE, credencial: credencial() }));
  await assert.rejects(adicionarContaOAuth(c, { servico: 'jira', nuvem: NUVEM, credencial: credencial() }), /JIRA_SITE_REQUIRED/);
  await assert.rejects(adicionarContaOAuth(c, { servico: 'jira', nuvem: NUVEM, instancia: 'https://evil.example.com', credencial: credencial() }), /SERVICE_DESTINATION_BLOCKED/);
  assert.equal(pedidos.length, 0);
});

test('destino do pedido: OAuth do Jira sai por api.atlassian.com/ex/jira/<id> e nada escapa dessa pasta', () => {
  const pedido = (caminho, extra = {}) => ({ servico: 'jira', instancia: SITE, caminho, headers: {}, nuvem: NUVEM, ...extra });
  assert.equal(destinoDoPedido(pedido('/rest/api/3/myself'), 'GET').href, `https://api.atlassian.com/ex/jira/${NUVEM}/rest/api/3/myself`);
  assert.equal(destinoDoPedido(pedido('/rest/api/3/issue/APP-1/comment'), 'POST').pathname, `/ex/jira/${NUVEM}/rest/api/3/issue/APP-1/comment`);
  assert.throws(() => destinoDoPedido(pedido('/rest/api/3/issue/APP-1'), 'DELETE'), /SERVICE_WRITE_BLOCKED/);
  assert.throws(() => destinoDoPedido(pedido('/rest/api/3/project', { }), 'POST'), /SERVICE_WRITE_BLOCKED/, 'rota fora da lista fechada de escrita');
  for (const caminho of ['/../../x', `/../${OUTRA}/rest/api/3/myself`, '/rest/../../admin', '//api.atlassian.com/x', 'rest/api/3/myself', '/wiki/rest/api/x'])
    assert.throws(() => destinoDoPedido(pedido(caminho), 'GET'), /SERVICE_DESTINATION_BLOCKED/, caminho);
  for (const nuvem of ['', 'x', NUVEM + '/..', `${NUVEM}?x=1`, 'ZZZZZZZZ-1111-4111-8111-111111111111'])
    assert.throws(() => destinoDoPedido(pedido('/rest/api/3/myself', { nuvem }), 'GET'), /SERVICE_DESTINATION_BLOCKED/, 'nuvem ' + nuvem);
  assert.throws(() => destinoDoPedido({ servico: 'github', instancia: 'https://api.github.com', caminho: '/user', headers: {}, nuvem: NUVEM }, 'GET'), /SERVICE_DESTINATION_BLOCKED/, 'nuvem só existe no Jira');
  assert.equal(destinoDoPedido({ servico: 'jira', instancia: SITE, caminho: '/rest/api/3/myself', headers: {} }, 'GET').href, `${SITE}/rest/api/3/myself`, 'token de API continua indo ao site');
  assert.equal(destinoDoPedido({ servico: 'github', instancia: 'https://api.github.com', caminho: '/user', headers: {} }, 'GET').href, 'https://api.github.com/user');
});

test('renovação: acesso perto de vencer é renovado uma única vez, mesmo com pedidos simultâneos, e o par novo vai ao cofre', async (t) => {
  const chamadas = [];
  const renovar = async (servico, renovacao) => { chamadas.push([servico, renovacao]); await new Promise((r) => setTimeout(r, 15)); return { acesso: 'ghu_novo', renovacao: 'ghr_novo', expiraEm: Date.now() + 8 * 3600_000 }; };
  const { c, cofre, pedidos } = ambiente(t, { renovar });
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial({ expiraEm: Date.now() + 30_000 }) });
  const contas = await Promise.all([1, 2, 3, 4, 5].map(() => contaAtivaRenovada(c, conta.id)));
  assert.equal(chamadas.length, 1);
  assert.deepEqual(chamadas[0], ['github', 'ghr_renovacao']);
  assert.ok(contas.every((x) => x.id === conta.id));
  const guardado = JSON.parse(cofre.ler(conta.id));
  assert.equal(guardado.acesso, 'ghu_novo'); assert.equal(guardado.renovacao, 'ghr_novo');
  await adaptadorDaConta(c, await contaAtivaRenovada(c, conta.id)).autenticar();
  assert.equal(pedidos.at(-1).headers.Authorization, 'Bearer ghu_novo', 'o acesso antigo não é mais usado');
  await contaAtivaRenovada(c, conta.id);
  assert.equal(chamadas.length, 1, 'acesso ainda válido não renova');
});

test('renovação sem refresh token, sem renovador ou recusada pelo serviço pede conexão nova', async (t) => {
  const recusa = ambiente(t, { renovar: async () => { throw new Error('INTEGRATION_INVALID'); } });
  const a = await adicionarContaOAuth(recusa.c, { servico: 'github', credencial: credencial({ expiraEm: Date.now() + 1000 }) });
  await assert.rejects(contaAtivaRenovada(recusa.c, a.id), /CREDENTIAL_INVALID_OR_EXPIRED/);
  assert.equal(JSON.parse(recusa.cofre.ler(a.id)).acesso, 'ghu_acesso', 'falha não apaga a credencial guardada');
  const sem = ambiente(t);
  const b = await adicionarContaOAuth(sem.c, { servico: 'github', credencial: credencial({ expiraEm: Date.now() + 1000 }) });
  await assert.rejects(contaAtivaRenovada(sem.c, b.id), /CREDENTIAL_INVALID_OR_EXPIRED/);
  const semRefresh = ambiente(t, { renovar: async () => ({ acesso: 'x' }) });
  const d = await adicionarContaOAuth(semRefresh.c, { servico: 'github', credencial: { acesso: 'ghu_acesso', expiraEm: Date.now() + 1000 } });
  await assert.rejects(contaAtivaRenovada(semRefresh.c, d.id), /CREDENTIAL_INVALID_OR_EXPIRED/);
});

test('renovação devolvendo credencial inválida não grava nada', async (t) => {
  const { c, cofre } = ambiente(t, { renovar: async () => ({ acesso: '' }) });
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial({ expiraEm: Date.now() + 1000 }) });
  await assert.rejects(contaAtivaRenovada(c, conta.id), /CREDENTIAL_INVALID_OR_EXPIRED/);
  assert.equal(JSON.parse(cofre.ler(conta.id)).acesso, 'ghu_acesso');
});

test('conta OAuth não aceita token colado: a troca exige conectar de novo', async (t) => {
  const { c } = ambiente(t);
  const conta = await adicionarContaOAuth(c, { servico: 'github', credencial: credencial() });
  await assert.rejects(trocarToken(c, conta.id, 'ghp_manual'), /OAUTH_RECONNECT_REQUIRED/);
});

test('vínculo desativado bloqueia no backend antes de qualquer pedido; reativar restaura; conta OAuth renova no caminho', async (t) => {
  const renovar = async () => ({ acesso: 'jira_novo', renovacao: 'jira_r_novo', expiraEm: Date.now() + 3600_000 });
  const { c, base, pedidos } = ambiente(t, { renovar });
  const conta = await adicionarContaOAuth(c, { servico: 'jira', instancia: SITE, nuvem: NUVEM, credencial: credencial({ acesso: 'jira_acesso', renovacao: 'jira_renovacao', expiraEm: Date.now() + 1000 }) });
  const recurso = { id: '10000', chave: 'APP', nome: 'App', instancia: SITE, contaId: conta.contaId, tipoId: 'id_api' };
  const projeto = await criarEspaco({ nome: 'App', descricao: '' }, base, { servico: 'jira', conexaoId: conta.id, recurso });
  alternarVinculoServico(projeto.id, 'jira', false, base);
  const antes = pedidos.length;
  await assert.rejects(verificarVinculoDoServico(c, projeto.id, 'jira'), /SERVICE_DISABLED/);
  assert.equal(pedidos.length, antes, 'desativado: nenhuma chamada ao serviço externo');
  assert.equal(obterEspaco(projeto.id, base).vinculos[0].desligado, true, 'o vínculo e o histórico continuam');
  alternarVinculoServico(projeto.id, 'jira', true, base);
  const v = await verificarVinculoDoServico(c, projeto.id, 'jira');
  assert.equal(v.recurso.chave, 'APP');
  assert.equal(pedidos.at(-1).headers.Authorization, 'Bearer jira_novo', 'a renovação aconteceu antes da consulta');
});
