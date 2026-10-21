/** Cliente do serviço do Prumo para autorizar GitHub e Jira: usa o cookie da sessão, valida o que recebe e traduz erros sem texto externo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chamarServicoDoPrumo, entrarRemotamente, sairRemotamente } from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import { encerrarSessao } from '../../../../dist/login/regras/sessao.js';
import { disponiveisNoServico, estadoNoServico, iniciarNoServico, renovarPeloServico, retirarDoServico, revogarPeloServico } from '../../../../dist/conexoes/integracoes/servicoDeAutorizacao.js';

const TENTATIVA = 'abcdefghijklmnopqrstuvwxyz012345';
const SITE = { id: '11111111-1111-4111-8111-111111111111', nome: 'Empresa', url: 'https://empresa.atlassian.net' };

/** Troca fetch e endereço do serviço por uma versão simulada; `rota` responde as chamadas de /v1/integracoes. */
function ambiente(t, rota) {
  const antes = { url: process.env.PRUMO_AUTH_API_URL, fetch: globalThis.fetch };
  process.env.PRUMO_AUTH_API_URL = 'https://prumo.example';
  const pedidos = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    const u = new URL(url);
    if (u.pathname === '/api/auth/sign-in/email') return new Response('{}', { headers: { 'Content-Type': 'application/json', 'set-cookie': '__Secure-better-auth.session_token=sessao123; Path=/; HttpOnly; Secure' } });
    if (u.pathname === '/api/auth/get-session') return Response.json({ session: { expiresAt: new Date(Date.now() + 3600_000).toISOString() }, user: { id: 'identidadeRemota123', email: 'pessoa@example.com', name: 'Pessoa', emailVerified: true } });
    if (u.pathname === '/api/auth/sign-out') return Response.json({ success: true });
    pedidos.push({ metodo: opcoes.method ?? 'GET', caminho: u.pathname + u.search, cookie: opcoes.headers?.Cookie, origem: opcoes.headers?.Origin, corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined });
    return rota(u, opcoes);
  };
  t.after(async () => {
    await sairRemotamente(); encerrarSessao(); globalThis.fetch = antes.fetch;
    if (antes.url === undefined) delete process.env.PRUMO_AUTH_API_URL; else process.env.PRUMO_AUTH_API_URL = antes.url;
  });
  return { pedidos, entrar: () => entrarRemotamente('pessoa@example.com', 'senha-de-teste-123') };
}
const json = (corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

test('sem sessão remota ativa ou sem o endereço do serviço, nada é enviado', async (t) => {
  const { pedidos } = ambiente(t, () => json({}));
  await assert.rejects(iniciarNoServico('github'), /SESSION_REQUIRED/, 'sem entrar no Prumo');
  delete process.env.PRUMO_AUTH_API_URL;
  await assert.rejects(iniciarNoServico('github'), /INTEGRATION_NOT_CONFIGURED/, 'sem serviço central');
  assert.equal(pedidos.length, 0);
});

test('as quatro rotas levam o cookie da sessão e a origem, e validam o que recebem', async (t) => {
  const { pedidos, entrar } = ambiente(t, (u) => {
    if (u.pathname.endsWith('/iniciar')) return json({ tentativa: TENTATIVA, url: 'https://github.com/login/oauth/authorize?client_id=x', instalarUrl: 'https://github.com/apps/prumo-qa/installations/new' });
    if (u.pathname.endsWith('/estado')) return json({ estado: 'PRONTO' });
    if (u.pathname.endsWith('/retirar')) return json({ acesso: 'jira_acesso', renovacao: 'jira_renovacao', expiraEm: 99, sites: [SITE] });
    if (u.pathname.endsWith('/renovar')) return json({ acesso: 'novo', renovacao: 'novo-r', expiraEm: 100 });
    if (u.pathname.endsWith('/revogar')) return json({ revogado: true });
    return json({}, 404);
  });
  await entrar();
  const inicio = await iniciarNoServico('github');
  assert.equal(inicio.tentativa, TENTATIVA);
  assert.deepEqual(await estadoNoServico(TENTATIVA), { estado: 'PRONTO' });
  assert.deepEqual((await retirarDoServico(TENTATIVA)).sites, [SITE]);
  assert.deepEqual(await renovarPeloServico('jira', 'jira_renovacao'), { acesso: 'novo', renovacao: 'novo-r', expiraEm: 100 });
  await revogarPeloServico('github', 'ghu_acesso');
  assert.deepEqual(pedidos.map((p) => p.metodo + ' ' + p.caminho), ['POST /v1/integracoes/iniciar', 'GET /v1/integracoes/estado?tentativa=' + TENTATIVA, 'POST /v1/integracoes/retirar', 'POST /v1/integracoes/renovar', 'POST /v1/integracoes/revogar']);
  for (const p of pedidos) assert.match(p.cookie, /session_token=sessao123/);
  for (const p of pedidos.filter((x) => x.metodo === 'POST')) assert.equal(p.origem, 'https://prumo.example', 'POST leva Origin, como o Better Auth exige');
  assert.deepEqual(pedidos[0].corpo, { servico: 'github' });
  assert.deepEqual(pedidos[3].corpo, { servico: 'jira', renovacao: 'jira_renovacao' });
});

test('resposta fora do formato (ou com endereço de outro site) é recusada pelo cliente', async (t) => {
  const { entrar } = ambiente(t, (u) => {
    if (u.pathname.endsWith('/iniciar')) return json({ tentativa: TENTATIVA, url: 'https://evil.example/login/oauth/authorize?x=1' });
    if (u.pathname.endsWith('/retirar')) return json({ acesso: '' });
    return json({ estado: 'QUALQUER' });
  });
  await entrar();
  await assert.rejects(iniciarNoServico('github'));
  await assert.rejects(retirarDoServico(TENTATIVA));
  await assert.rejects(estadoNoServico(TENTATIVA));
});

test('erros do serviço viram códigos fixos, sem repetir o texto recebido', async (t) => {
  const casos = [[401, {}, 'SESSION_EXPIRED'], [429, {}, 'INTEGRATION_RATE_LIMIT'], [404, { erro: 'ATTEMPT_NOT_FOUND' }, 'INTEGRATION_INVALID'], [400, {}, 'INTEGRATION_INVALID'],
    [503, { erro: 'INTEGRATION_NOT_CONFIGURED' }, 'INTEGRATION_NOT_CONFIGURED'], [503, { erro: 'AUTH_NOT_CONFIGURED' }, 'IDENTITY_NOT_CONFIGURED'], [502, { erro: 'INTEGRATION_FAILED', detalhe: 'token ghu_vazado' }, 'IDENTITY_SERVICE_UNAVAILABLE']];
  let atual = 0;
  const { entrar } = ambiente(t, () => json(casos[atual][1], casos[atual][0]));
  await entrar();
  for (atual = 0; atual < casos.length; atual++) {
    await assert.rejects(chamarServicoDoPrumo('/v1/integracoes/iniciar', { servico: 'github' }), (e) => { assert.equal(e.message, casos[atual][2]); assert.ok(!e.message.includes('ghu_vazado')); return true; }, 'status ' + casos[atual][0]);
  }
});

test('sem rede o cliente informa serviço indisponível', async (t) => {
  const { entrar } = ambiente(t, () => { throw new Error('rede caiu'); });
  await entrar();
  await assert.rejects(estadoNoServico(TENTATIVA), /IDENTITY_SERVICE_UNAVAILABLE/);
});

test('disponíveis: serviço antigo (404), não configurado (503), sem sessão ou sem rede valem como "nenhum"; resposta válida vale como está', async (t) => {
  let resposta = () => json({ erro: 'NOT_FOUND' }, 404);
  const { entrar } = ambiente(t, () => resposta());
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: false }, 'sem sessão');
  await entrar();
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: false }, '404 do serviço antigo');
  resposta = () => json({ erro: 'INTEGRATION_NOT_CONFIGURED' }, 503);
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: false }, '503');
  resposta = () => { throw new Error('rede'); };
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: false }, 'sem rede');
  resposta = () => json({ github: true, jira: 'sim' });
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: false }, 'formato inválido');
  resposta = () => json({ github: false, jira: true });
  assert.deepEqual(await disponiveisNoServico(), { github: false, jira: true });
});
