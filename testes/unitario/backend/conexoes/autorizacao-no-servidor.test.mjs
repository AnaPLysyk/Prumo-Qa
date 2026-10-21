/** Autorização de GitHub e Jira pelo navegador, lado do serviço do Prumo: segredo só no servidor, estado de uso único, entrega única. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  armazenamentoEmMemoria, armazenamentoPostgres, cifrador, configuracaoDasIntegracoes, criarBroker, rotaDeIntegracoes, SQL_DAS_TENTATIVAS
} from '../../../../backend/conexoes/servidor/autorizacao.mjs';
import { criarLimitador } from '../../../../backend/compartilhado/servidor/comum.mjs';
import { respostaDeInicio, respostaDeRetirada } from '../../../../dist/conexoes/tipos/autorizacao.js';
import { credencialOAuthSchema } from '../../../../dist/conexoes/tipos/contaDeServico.js';

const ENV = { BETTER_AUTH_URL: 'https://prumo.example', BETTER_AUTH_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres', PRUMO_GITHUB_APP_CLIENT_ID: 'Iv1.githubid', PRUMO_GITHUB_APP_CLIENT_SECRET: 'segredo-do-github',
  PRUMO_GITHUB_APP_SLUG: 'prumo-qa', PRUMO_JIRA_CLIENT_ID: 'jiraid', PRUMO_JIRA_CLIENT_SECRET: 'segredo-do-jira' };
const SITE_A = '11111111-1111-4111-8111-111111111111';

/** Provedores simulados: registram cada pedido e respondem como GitHub e Atlassian respondem. */
function provedores(ajuste = {}) {
  const chamadas = [];
  const fetcher = async (url, opcoes = {}) => {
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    chamadas.push({ url: String(url), metodo: opcoes.method ?? 'GET', corpo, cabecalhos: opcoes.headers ?? {} });
    const resp = (status, dados) => new Response(status === 204 ? null : JSON.stringify(dados), { status, headers: { 'content-type': 'application/json' } });
    if (ajuste.falhaDeRede) throw new Error('rede');
    if (url === 'https://github.com/login/oauth/access_token') {
      if (ajuste.githubRecusa) return resp(200, { error: 'bad_verification_code' });
      return resp(200, corpo.grant_type === 'refresh_token'
        ? { access_token: 'ghu_novo', refresh_token: 'ghr_novo', expires_in: 28800 }
        : { access_token: 'ghu_acesso', refresh_token: 'ghr_renovacao', expires_in: 28800, refresh_token_expires_in: 15811200 });
    }
    if (url === 'https://auth.atlassian.com/oauth/token') {
      return resp(200, corpo.grant_type === 'refresh_token'
        ? { access_token: 'jira_novo', refresh_token: 'jira_r_novo', expires_in: 3600 }
        : { access_token: 'jira_acesso', refresh_token: 'jira_renovacao', expires_in: 3600 });
    }
    if (url === 'https://api.atlassian.com/oauth/token/accessible-resources') {
      return resp(200, [{ id: SITE_A, name: 'Empresa', url: 'https://empresa.atlassian.net' }, { id: '22222222-2222-4222-8222-222222222222', name: 'Mal', url: 'https://evil.example.com' }]);
    }
    if (String(url).startsWith('https://api.github.com/applications/')) return resp(ajuste.revogacao ?? 204, {});
    return resp(404, {});
  };
  return { fetcher, chamadas };
}

function criar(opcoes = {}) {
  let t = 1_000_000;
  const agora = () => t;
  const armazenamento = opcoes.armazenamento ?? armazenamentoEmMemoria();
  const p = provedores(opcoes.provedores);
  const broker = criarBroker({ config: configuracaoDasIntegracoes(opcoes.env ?? ENV), armazenamento, cifra: cifrador(ENV.BETTER_AUTH_SECRET), fetcher: p.fetcher, agora });
  return { broker, p, avancar: (ms) => { t += ms; }, armazenamento };
}
const parametrosDe = (url) => new URL(url).searchParams;

test('configuração: cada serviço só liga com o conjunto completo e o endereço público em HTTPS', () => {
  const c = configuracaoDasIntegracoes(ENV);
  assert.equal(c.github.callbackUrl, 'https://prumo.example/v1/integracoes/retorno/github');
  assert.equal(c.jira.callbackUrl, 'https://prumo.example/v1/integracoes/retorno/jira');
  assert.equal(configuracaoDasIntegracoes({ ...ENV, PRUMO_GITHUB_APP_CLIENT_SECRET: '' }).github, null);
  assert.equal(configuracaoDasIntegracoes({ ...ENV, PRUMO_GITHUB_APP_SLUG: 'com espaço/../' }).github, null);
  assert.equal(configuracaoDasIntegracoes({ ...ENV, PRUMO_JIRA_CLIENT_ID: '' }).jira, null);
  assert.deepEqual(configuracaoDasIntegracoes({ ...ENV, BETTER_AUTH_URL: 'http://prumo.example' }), { github: null, jira: null });
  assert.deepEqual(configuracaoDasIntegracoes({}), { github: null, jira: null });
});

test('GitHub: a URL leva state, PKCE S256 e retorno HTTPS, nunca o segredo; o servidor troca o código com o verificador certo', async () => {
  const { broker, p } = criar();
  const inicio = await broker.iniciar({ ator: 'pessoa-1', servico: 'github' });
  assert.equal(inicio.instalarUrl, 'https://github.com/apps/prumo-qa/installations/new');
  const q = parametrosDe(inicio.url);
  assert.equal(new URL(inicio.url).origin + new URL(inicio.url).pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(q.get('client_id'), 'Iv1.githubid');
  assert.equal(q.get('redirect_uri'), 'https://prumo.example/v1/integracoes/retorno/github');
  assert.equal(q.get('code_challenge_method'), 'S256');
  assert.equal(q.get('scope'), null, 'GitHub App não pede escopos de repositório: as permissões vêm do cadastro do aplicativo');
  assert.ok(!inicio.url.includes('segredo-do-github'));
  assert.equal(await broker.concluirRetorno({ servico: 'github', estado: q.get('state'), codigo: 'codigo-do-github' }), 'PRONTO');
  const troca = p.chamadas.find((c) => c.url === 'https://github.com/login/oauth/access_token');
  assert.equal(troca.corpo.client_secret, 'segredo-do-github');
  assert.equal(troca.corpo.code, 'codigo-do-github');
  assert.equal(createHash('sha256').update(troca.corpo.code_verifier).digest('base64url'), q.get('code_challenge'));
});

test('retirada: só o dono, uma única vez, e o estado vira PRONTO só depois da troca de código', async () => {
  const { broker } = criar();
  const inicio = await broker.iniciar({ ator: 'pessoa-1', servico: 'github' });
  assert.deepEqual(await broker.estado({ ator: 'pessoa-1', tentativa: inicio.tentativa }), { estado: 'PENDENTE' });
  await broker.concluirRetorno({ servico: 'github', estado: parametrosDe(inicio.url).get('state'), codigo: 'c' });
  assert.deepEqual(await broker.estado({ ator: 'pessoa-1', tentativa: inicio.tentativa }), { estado: 'PRONTO' });
  await assert.rejects(broker.estado({ ator: 'pessoa-2', tentativa: inicio.tentativa }), /ATTEMPT_NOT_FOUND/);
  await assert.rejects(broker.retirar({ ator: 'pessoa-2', tentativa: inicio.tentativa }), /ATTEMPT_NOT_FOUND/);
  const entrega = await broker.retirar({ ator: 'pessoa-1', tentativa: inicio.tentativa });
  assert.equal(entrega.acesso, 'ghu_acesso');
  assert.equal(entrega.renovacao, 'ghr_renovacao');
  assert.equal(entrega.expiraEm, 1_000_000 + 28800 * 1000);
  await assert.rejects(broker.retirar({ ator: 'pessoa-1', tentativa: inicio.tentativa }), /ATTEMPT_NOT_FOUND/, 'depois da entrega o serviço não guarda mais nada');
  await assert.rejects(broker.estado({ ator: 'pessoa-1', tentativa: inicio.tentativa }), /ATTEMPT_NOT_FOUND/);
});

test('state de uso único: repetição, outro serviço, inventado ou vazio nunca trocam código', async () => {
  const { broker, p } = criar();
  const inicio = await broker.iniciar({ ator: 'a', servico: 'github' });
  const state = parametrosDe(inicio.url).get('state');
  await assert.rejects(broker.concluirRetorno({ servico: 'jira', estado: state, codigo: 'c' }), /OAUTH_STATE_INVALID/, 'state do GitHub não vale no Jira');
  await assert.rejects(broker.concluirRetorno({ servico: 'github', estado: 'inventado', codigo: 'c' }), /OAUTH_STATE_INVALID/);
  await assert.rejects(broker.concluirRetorno({ servico: 'github', estado: '', codigo: 'c' }), /OAUTH_STATE_INVALID/);
  await broker.concluirRetorno({ servico: 'github', estado: state, codigo: 'c' });
  await assert.rejects(broker.concluirRetorno({ servico: 'github', estado: state, codigo: 'c' }), /OAUTH_STATE_INVALID/, 'repetição da mesma volta');
  assert.equal(p.chamadas.filter((c) => c.url.endsWith('/access_token')).length, 1);
});

test('duas voltas ao mesmo tempo com o mesmo state: só uma troca o código', async () => {
  const { broker, p } = criar();
  const inicio = await broker.iniciar({ ator: 'a', servico: 'github' });
  const state = parametrosDe(inicio.url).get('state');
  const r = await Promise.allSettled([broker.concluirRetorno({ servico: 'github', estado: state, codigo: 'c' }), broker.concluirRetorno({ servico: 'github', estado: state, codigo: 'c' })]);
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(p.chamadas.filter((c) => c.url.endsWith('/access_token')).length, 1);
});

test('recusa na tela do provedor, falha do provedor e erro de rede terminam sem nada para retirar', async () => {
  const negada = criar(); const a = await negada.broker.iniciar({ ator: 'a', servico: 'github' });
  assert.equal(await negada.broker.concluirRetorno({ servico: 'github', estado: parametrosDe(a.url).get('state'), erro: 'access_denied' }), 'NEGADO');
  assert.deepEqual(await negada.broker.estado({ ator: 'a', tentativa: a.tentativa }), { estado: 'NEGADO' });
  await assert.rejects(negada.broker.retirar({ ator: 'a', tentativa: a.tentativa }), /ATTEMPT_NOT_FOUND/);
  for (const ajuste of [{ githubRecusa: true }, { falhaDeRede: true }]) {
    const x = criar({ provedores: ajuste }); const t = await x.broker.iniciar({ ator: 'a', servico: 'github' });
    assert.equal(await x.broker.concluirRetorno({ servico: 'github', estado: parametrosDe(t.url).get('state'), codigo: 'c' }), 'ERRO');
    assert.deepEqual(await x.broker.estado({ ator: 'a', tentativa: t.tentativa }), { estado: 'ERRO' });
    await assert.rejects(x.broker.retirar({ ator: 'a', tentativa: t.tentativa }), /ATTEMPT_NOT_FOUND/);
  }
});

test('prazo de 5 minutos: depois dele a volta é recusada e o estado vira EXPIRADO', async () => {
  const { broker, avancar } = criar();
  const a = await broker.iniciar({ ator: 'a', servico: 'jira' });
  avancar(5 * 60_000 + 1);
  assert.deepEqual(await broker.estado({ ator: 'a', tentativa: a.tentativa }), { estado: 'EXPIRADO' });
  await assert.rejects(broker.concluirRetorno({ servico: 'jira', estado: parametrosDe(a.url).get('state'), codigo: 'c' }), /OAUTH_STATE_INVALID/);
});

test('Jira: pede offline_access, lista só sites *.atlassian.net e entrega vencimento do acesso', async () => {
  const { broker, p } = criar();
  const inicio = await broker.iniciar({ ator: 'a', servico: 'jira' });
  const q = parametrosDe(inicio.url);
  assert.equal(inicio.instalarUrl, undefined);
  assert.equal(new URL(inicio.url).origin, 'https://auth.atlassian.com');
  assert.equal(q.get('audience'), 'api.atlassian.com');
  assert.match(q.get('scope'), /offline_access/);
  assert.match(q.get('scope'), /read:jira-work/);
  assert.ok(!inicio.url.includes('segredo-do-jira'));
  await broker.concluirRetorno({ servico: 'jira', estado: q.get('state'), codigo: 'c' });
  const recursos = p.chamadas.find((c) => c.url.endsWith('/accessible-resources'));
  assert.equal(recursos.cabecalhos.Authorization, 'Bearer jira_acesso');
  const entrega = await broker.retirar({ ator: 'a', tentativa: inicio.tentativa });
  assert.deepEqual(entrega.sites, [{ id: SITE_A, nome: 'Empresa', url: 'https://empresa.atlassian.net' }]);
  assert.equal(entrega.expiraEm, 1_000_000 + 3600 * 1000);
  assert.equal(entrega.renovacao, 'jira_renovacao');
});

test('escopos do Jira podem ser reduzidos pela equipe sem mudar código', async () => {
  const { broker } = criar({ env: { ...ENV, PRUMO_JIRA_ESCOPOS: 'read:jira-work offline_access' } });
  const q = parametrosDe((await broker.iniciar({ ator: 'a', servico: 'jira' })).url);
  assert.equal(q.get('scope'), 'read:jira-work offline_access');
});

test('serviço não configurado ou desconhecido recusa antes de qualquer tentativa', async () => {
  const sem = criar({ env: { ...ENV, PRUMO_JIRA_CLIENT_ID: '' } });
  await assert.rejects(sem.broker.iniciar({ ator: 'a', servico: 'jira' }), /INTEGRATION_NOT_CONFIGURED/);
  await assert.rejects(sem.broker.iniciar({ ator: 'a', servico: 'qase' }), /INVALID_SERVICE/);
  await assert.rejects(sem.broker.iniciar({ ator: 'a', servico: '__proto__' }), /INVALID_SERVICE/);
  assert.equal(sem.p.chamadas.length, 0);
});

test('renovação: o refresh token gira e o par novo volta com o vencimento; token vazio ou enorme é recusado', async () => {
  const { broker, p } = criar();
  const gh = await broker.renovar({ servico: 'github', renovacao: 'ghr_renovacao' });
  assert.deepEqual(gh, { acesso: 'ghu_novo', renovacao: 'ghr_novo', expiraEm: 1_000_000 + 28800 * 1000 });
  const troca = p.chamadas.at(-1).corpo;
  assert.equal(troca.grant_type, 'refresh_token'); assert.equal(troca.client_secret, 'segredo-do-github'); assert.equal(troca.refresh_token, 'ghr_renovacao');
  const jira = await broker.renovar({ servico: 'jira', renovacao: 'jira_renovacao' });
  assert.equal(jira.acesso, 'jira_novo'); assert.equal(jira.renovacao, 'jira_r_novo');
  await assert.rejects(broker.renovar({ servico: 'github', renovacao: '' }), /INVALID_REFRESH_TOKEN/);
  await assert.rejects(broker.renovar({ servico: 'github', renovacao: 'x'.repeat(2001) }), /INVALID_REFRESH_TOKEN/);
});

test('revogação: GitHub revoga o acesso do aplicativo; Jira informa que não há revogação por API', async () => {
  const { broker, p } = criar();
  assert.deepEqual(await broker.revogar({ servico: 'github', acesso: 'ghu_acesso' }), { revogado: true });
  const pedido = p.chamadas.at(-1);
  assert.equal(pedido.metodo, 'DELETE');
  assert.equal(pedido.url, 'https://api.github.com/applications/Iv1.githubid/token');
  assert.equal(pedido.cabecalhos.Authorization, 'Basic ' + Buffer.from('Iv1.githubid:segredo-do-github').toString('base64'));
  assert.deepEqual(pedido.corpo, { access_token: 'ghu_acesso' });
  assert.deepEqual(await broker.revogar({ servico: 'jira', acesso: 'jira_acesso' }), { revogado: false });
  assert.deepEqual(await criar({ provedores: { revogacao: 404 } }).broker.revogar({ servico: 'github', acesso: 'a' }), { revogado: true }, 'já revogado também conta');
  assert.deepEqual(await criar({ provedores: { revogacao: 500 } }).broker.revogar({ servico: 'github', acesso: 'a' }), { revogado: false });
});

test('enquanto esperam a retirada, verificador e credenciais ficam cifrados e presos ao id da tentativa', async () => {
  const guardado = [];
  const base = armazenamentoEmMemoria();
  const armazenamento = { ...base, criar: async (t) => { guardado.push(t.segredo); return base.criar(t); }, finalizar: async (id, s, segredo) => { if (segredo) guardado.push(segredo); return base.finalizar(id, s, segredo); } };
  const { broker } = criar({ armazenamento });
  const inicio = await broker.iniciar({ ator: 'a', servico: 'github' });
  await broker.concluirRetorno({ servico: 'github', estado: parametrosDe(inicio.url).get('state'), codigo: 'c' });
  assert.equal(guardado.length, 2);
  for (const texto of guardado) { assert.ok(!texto.includes('ghu_acesso') && !texto.includes('ghr_renovacao')); assert.ok(!Buffer.from(texto, 'base64').toString('latin1').includes('verificador')); }
  const cifra = cifrador(ENV.BETTER_AUTH_SECRET);
  assert.equal(cifra.abrir(guardado[1], inicio.tentativa).acesso, 'ghu_acesso');
  assert.throws(() => cifra.abrir(guardado[1], 'outra-tentativa'), 'mover o texto para outra tentativa não abre');
  assert.throws(() => cifrador('outro-segredo-com-mais-de-32-caracteres!!').abrir(guardado[1], inicio.tentativa));
});

// --- PostgreSQL (simulado: confere a ordem dos parâmetros e que cada passo é um único comando atômico) ---
function bancoSimulado() {
  const linhas = []; const comandos = [];
  return {
    comandos, linhas,
    async query(sql, p = []) {
      comandos.push({ sql, p });
      if (sql.startsWith('CREATE TABLE')) return { rows: [] };
      if (sql.startsWith('DELETE FROM prumo_integracao_tentativa WHERE expira_em <')) { for (let i = linhas.length - 1; i >= 0; i--) if (linhas[i].expira_em < p[0]) linhas.splice(i, 1); return { rows: [] }; }
      if (sql.startsWith('INSERT')) { linhas.push({ id: p[0], ator: p[1], servico: p[2], estado_hash: p[3], situacao: p[4], segredo: p[5], expira_em: p[6] }); return { rows: [] }; }
      if (sql.startsWith("UPDATE prumo_integracao_tentativa SET situacao='PROCESSANDO'")) {
        const l = linhas.find((x) => x.estado_hash === p[0] && x.servico === p[1] && x.situacao === 'PENDENTE' && x.expira_em >= p[2]);
        if (!l) return { rows: [] }; l.situacao = 'PROCESSANDO'; return { rows: [{ id: l.id, ator: l.ator, segredo: l.segredo }] };
      }
      if (sql.startsWith('UPDATE prumo_integracao_tentativa SET situacao=$2, segredo=$3')) { const l = linhas.find((x) => x.id === p[0]); l.situacao = p[1]; l.segredo = p[2]; return { rows: [] }; }
      if (sql.startsWith('UPDATE prumo_integracao_tentativa SET situacao=$2 WHERE')) { linhas.find((x) => x.id === p[0]).situacao = p[1]; return { rows: [] }; }
      if (sql.startsWith('SELECT situacao, expira_em')) { const l = linhas.find((x) => x.id === p[0] && x.ator === p[1]); return { rows: l ? [{ situacao: l.situacao, expira_em: l.expira_em }] : [] }; }
      if (sql.startsWith('DELETE FROM prumo_integracao_tentativa WHERE id=$1')) {
        const i = linhas.findIndex((x) => x.id === p[0] && x.ator === p[1] && x.situacao === 'PRONTO' && x.expira_em >= p[2]);
        if (i < 0) return { rows: [] }; const [l] = linhas.splice(i, 1); return { rows: [{ segredo: l.segredo }] };
      }
      throw new Error('comando inesperado: ' + sql);
    }
  };
}

test('PostgreSQL: o mesmo fluxo completo funciona e nenhum valor da pessoa entra no texto do comando', async () => {
  const pool = bancoSimulado();
  const { broker } = criar({ armazenamento: armazenamentoPostgres(pool) });
  const inicio = await broker.iniciar({ ator: 'pessoa-1', servico: 'jira' });
  const state = parametrosDe(inicio.url).get('state');
  await broker.concluirRetorno({ servico: 'jira', estado: state, codigo: 'c' });
  await assert.rejects(broker.concluirRetorno({ servico: 'jira', estado: state, codigo: 'c' }), /OAUTH_STATE_INVALID/);
  assert.equal((await broker.estado({ ator: 'pessoa-1', tentativa: inicio.tentativa })).estado, 'PRONTO');
  assert.equal((await broker.retirar({ ator: 'pessoa-1', tentativa: inicio.tentativa })).acesso, 'jira_acesso');
  await assert.rejects(broker.retirar({ ator: 'pessoa-1', tentativa: inicio.tentativa }), /ATTEMPT_NOT_FOUND/);
  assert.equal(pool.linhas.length, 0);
  assert.equal(pool.comandos[0].sql, SQL_DAS_TENTATIVAS);
  for (const { sql } of pool.comandos) for (const segredo of [state, inicio.tentativa, 'pessoa-1', 'jira_acesso']) assert.ok(!sql.includes(segredo), 'valores só por parâmetro');
  assert.ok(pool.comandos.every(({ sql }) => !sql.startsWith('CREATE') || sql === SQL_DAS_TENTATIVAS));
  assert.equal(pool.comandos.filter(({ sql }) => sql.startsWith('CREATE')).length, 1, 'a tabela é preparada uma vez');
});

test('PostgreSQL: tentativa vencida some na próxima criação e o state guardado é só o resumo', async () => {
  const pool = bancoSimulado();
  const { broker, avancar } = criar({ armazenamento: armazenamentoPostgres(pool) });
  const velha = await broker.iniciar({ ator: 'a', servico: 'github' });
  avancar(6 * 60_000);
  await broker.iniciar({ ator: 'a', servico: 'github' });
  assert.equal(pool.linhas.length, 1);
  assert.ok(!pool.linhas.some((l) => l.id === velha.tentativa));
  assert.match(pool.linhas[0].estado_hash, /^[0-9a-f]{64}$/);
});

// --- rotas HTTP (pedido e resposta simulados: servidor HTTP real é assunto do Lab) ---
async function servidor(t, { sessao = async () => 'pessoa-1', ajuste, limitador = criarLimitador() } = {}) {
  const { broker, p } = criar(ajuste);
  const rota = rotaDeIntegracoes({ broker, sessao, limitador, registrar: () => {} });
  const pedir = async (caminho, { metodo = 'GET', corpo, tipo = 'application/json' } = {}) => {
    const bruto = corpo === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(corpo));
    const req = Readable.from(bruto.length ? [bruto] : []);
    req.method = metodo; req.url = caminho; req.headers = corpo === undefined ? {} : { 'content-type': tipo }; req.socket = { remoteAddress: '127.0.0.1' };
    const saida = { status: 0, headers: {}, texto: '' };
    const res = { headersSent: false, writeHead(status, headers) { saida.status = status; saida.headers = headers; this.headersSent = true; }, end(texto) { saida.texto = String(texto ?? ''); } };
    const url = new URL(caminho, 'http://x');
    await rota(req, res, url.pathname, url.searchParams);
    return { status: saida.status, headers: { get: (n) => saida.headers[Object.keys(saida.headers).find((k) => k.toLowerCase() === n.toLowerCase())] ?? null }, json: async () => JSON.parse(saida.texto), text: async () => saida.texto };
  };
  return { pedir, p };
}

test('rotas: sem sessão verificada nada é iniciado, consultado, retirado, renovado nem revogado', async (t) => {
  const { pedir } = await servidor(t, { sessao: async () => null });
  for (const [caminho, opcoes] of [['/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'github' } }], ['/v1/integracoes/estado?tentativa=x', {}], ['/v1/integracoes/retirar', { metodo: 'POST', corpo: { tentativa: 'x' } }],
    ['/v1/integracoes/renovar', { metodo: 'POST', corpo: { servico: 'github', renovacao: 'x' } }], ['/v1/integracoes/revogar', { metodo: 'POST', corpo: { servico: 'github', acesso: 'x' } }]]) {
    assert.equal((await pedir(caminho, opcoes)).status, 401, caminho);
  }
});

test('rotas: iniciar exige JSON declarado, corpo pequeno e respeita o limite por pessoa', async (t) => {
  const { pedir } = await servidor(t);
  assert.equal((await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'github' }, tipo: 'text/plain' })).status, 415);
  assert.equal((await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'x'.repeat(5000) } })).status, 413);
  assert.equal((await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'qase' } })).status, 400);
  const ok = await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'github' } });
  assert.equal(ok.status, 200);
  const corpo = await ok.json();
  assert.match(corpo.tentativa, /^[A-Za-z0-9_-]{16,100}$/);
  assert.ok(corpo.url.startsWith('https://github.com/login/oauth/authorize?'));
  for (let i = 0; i < 7; i++) await pedir("/v1/integracoes/iniciar", { metodo: "POST", corpo: { servico: "github" } });
  assert.equal((await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'github' } })).status, 429);
});

test('rotas: o retorno do navegador devolve só uma página, sem token, e a volta repetida é recusada', async (t) => {
  const { pedir } = await servidor(t);
  const inicio = await (await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'jira' } })).json();
  const state = parametrosDe(inicio.url).get('state');
  const volta = await pedir(`/v1/integracoes/retorno/jira?code=abc&state=${state}`);
  const texto = await volta.text();
  assert.equal(volta.status, 200);
  assert.match(volta.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(texto, /Autorização concluída/);
  for (const segredo of ['jira_acesso', 'jira_renovacao', 'jiraid', 'segredo-do-jira', state]) assert.ok(!texto.includes(segredo), 'a página não carrega credencial');
  const repetida = await pedir(`/v1/integracoes/retorno/jira?code=abc&state=${state}`);
  assert.equal(repetida.status, 400);
  assert.match(await repetida.text(), /não é válido ou já foi usado/);
  assert.equal((await pedir(`/v1/integracoes/retorno/jira?code=abc&state=${state}`, { metodo: 'POST', corpo: {} })).status, 404, 'o retorno só aceita GET');
});

test('rotas: fluxo completo pelo HTTP entrega as credenciais uma vez e erros de provedor nunca vazam texto externo', async (t) => {
  const { pedir } = await servidor(t);
  const inicio = await (await pedir('/v1/integracoes/iniciar', { metodo: 'POST', corpo: { servico: 'github' } })).json();
  assert.deepEqual(await (await pedir('/v1/integracoes/estado?tentativa=' + inicio.tentativa)).json(), { estado: 'PENDENTE' });
  await pedir(`/v1/integracoes/retorno/github?code=abc&state=${parametrosDe(inicio.url).get('state')}`);
  const entrega = await (await pedir('/v1/integracoes/retirar', { metodo: 'POST', corpo: { tentativa: inicio.tentativa } })).json();
  assert.equal(entrega.acesso, 'ghu_acesso');
  const segunda = await pedir('/v1/integracoes/retirar', { metodo: 'POST', corpo: { tentativa: inicio.tentativa } });
  assert.equal(segunda.status, 404);
  assert.deepEqual(await segunda.json(), { erro: 'ATTEMPT_NOT_FOUND' });
  const renovada = await (await pedir('/v1/integracoes/renovar', { metodo: 'POST', corpo: { servico: 'github', renovacao: 'ghr_renovacao' } })).json();
  assert.equal(renovada.acesso, 'ghu_novo');
  assert.deepEqual(await (await pedir('/v1/integracoes/revogar', { metodo: 'POST', corpo: { servico: 'github', acesso: 'ghu_novo' } })).json(), { revogado: true });
});

test('rotas: falha do provedor vira código fixo, sem mensagem externa', async (t) => {
  const { pedir } = await servidor(t, { ajuste: { provedores: { falhaDeRede: true } } });
  const r = await pedir('/v1/integracoes/renovar', { metodo: 'POST', corpo: { servico: 'github', renovacao: 'ghr_renovacao' } });
  assert.equal(r.status, 502);
  assert.deepEqual(await r.json(), { erro: 'INTEGRATION_FAILED' });
});

test('contrato entre os dois lados: o que o serviço devolve é exatamente o que o app aceita', async () => {
  for (const servico of ['github', 'jira']) {
    const { broker } = criar();
    const inicio = await broker.iniciar({ ator: 'a', servico });
    assert.ok(respostaDeInicio.safeParse(inicio).success, 'iniciar ' + servico + ': ' + JSON.stringify(respostaDeInicio.safeParse(inicio).error?.issues));
    await broker.concluirRetorno({ servico, estado: parametrosDe(inicio.url).get('state'), codigo: 'c' });
    const entrega = await broker.retirar({ ator: 'a', tentativa: inicio.tentativa });
    assert.ok(respostaDeRetirada.safeParse(entrega).success, 'retirar ' + servico);
    assert.ok(credencialOAuthSchema.safeParse(await broker.renovar({ servico, renovacao: entrega.renovacao })).success, 'renovar ' + servico);
  }
});

test('disponíveis: o app descobre quais serviços já têm aplicativo oficial antes de oferecer o botão; só com sessão', async (t) => {
  const completo = await servidor(t);
  const r = await completo.pedir('/v1/integracoes/disponiveis');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { github: true, jira: true });
  const semJira = await servidor(t, { ajuste: { env: { ...ENV, PRUMO_JIRA_CLIENT_ID: '' } } });
  assert.deepEqual(await (await semJira.pedir('/v1/integracoes/disponiveis')).json(), { github: true, jira: false });
  const anonimo = await servidor(t, { sessao: async () => null });
  assert.equal((await anonimo.pedir('/v1/integracoes/disponiveis')).status, 401);
});
