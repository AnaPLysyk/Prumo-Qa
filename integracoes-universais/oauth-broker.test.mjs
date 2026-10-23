import test from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthBroker } from './oauth-broker.mjs';

const config = {
  github: { clientId: 'github-public-id', clientSecret: 'backend-secret', callbackUrl: 'https://prumo.example/oauth/github/callback' },
  jira: { clientId: 'atlassian-public-id', clientSecret: 'backend-secret', callbackUrl: 'https://prumo.example/oauth/jira/callback' }
};
const response = value => ({ ok: true, json: async () => value });
function environment({ slow = false, clock = () => Date.now() } = {}) {
  const calls = [], secrets = new Map(), links = new Map();
  const key = (a,p,s) => a+'/'+p+'/'+s;
  const fetcher = async (url, init) => {
    calls.push({url, init});
    if (slow) await new Promise(ok => setTimeout(ok, 5));
    if (url === 'https://github.com/login/oauth/access_token') return response({ access_token: 'ghu_TESTSECRET', expires_in: 28800 });
    if (url === 'https://auth.atlassian.com/oauth/token') return response({ access_token: 'jira-secret', refresh_token: 'rotation-secret', expires_in: 3600 });
    if (url.endsWith('/user')) return response({ id: 123, login: 'qa' });
    if (url.includes('/user/installations?')) return response({ installations: [{ id: 456 }] });
    if (url.includes('/repositories?')) return response({ repositories: [{ id: 111, full_name: 'qa/a' }, { id: 222, full_name: 'qa/b' }] });
    if (url.endsWith('/accessible-resources')) return response([{ id: 'site-1', name: 'Ambiente QA', url:'https://demo.atlassian.net', scopes:['read:jira-work'] }]);
    throw Error('UNEXPECTED_URL_' + url);
  };
  const vault = {
    put: async ({actorId, connectionId, ...value}) => secrets.set(actorId+'/'+connectionId,value),
    get: async ({actorId, connectionId}) => secrets.get(actorId+'/'+connectionId),
    delete: async ({actorId, connectionId}) => secrets.delete(actorId+'/'+connectionId)
  };
  const stores = {
    put: async item => links.set(key(item.actorId,item.projectId,item.service), item),
    get: async ({actorId,projectId,service}) => links.get(key(actorId,projectId,service)),
    delete: async ({actorId,projectId,service}) => links.delete(key(actorId,projectId,service))
  };
  return { broker: createOAuthBroker({config, fetcher, vault, links: stores, now:clock}), calls, links, secrets };
}

async function authorize(broker, service = 'github', actorId = 'a', projectId = 'p') {
  const flow = broker.start({actorId,projectId,service});
  const state = new URL(flow.url).searchParams.get('state');
  const r = await broker.complete({service,state,code:'mock-code'});
  return { flow, result:r };
}

test('GitHub App: PKCE, state, não envia scopes e usuário escolhe repositório', async () => {
  const {broker,calls,secrets} = environment();
  const {flow,result} = await authorize(broker);
  const authorizeUrl = new URL(flow.url);
  assert.equal(authorizeUrl.origin,'https://github.com');
  assert.equal(authorizeUrl.searchParams.get('code_challenge_method'),'S256');
  assert.ok(authorizeUrl.searchParams.get('code_challenge'));
  assert.equal(authorizeUrl.searchParams.has('scope'),false);
  assert.equal(result.status,'READY');
  const status = broker.status({actorId:'a',attemptId:flow.attemptId});
  assert.equal(status.resources.length,2);
  assert.equal(JSON.stringify(status).includes('ghu_TESTSECRET'),false);
  const exchange = JSON.parse(calls[0].init.body);
  assert.ok(exchange.code_verifier);
  assert.equal(exchange.client_secret,'backend-secret');
  await assert.rejects(broker.link({actorId:'a',attemptId:flow.attemptId,resourceId:'333'}),/RESOURCE_NOT_AUTHORIZED/);
  const selected = await broker.link({actorId:'a',attemptId:flow.attemptId,resourceId:'222'});
  assert.equal(selected.resource.name,'qa/b');
  assert.equal(selected.writeEnabled,false);
  assert.equal(secrets.size,1);
  await assert.rejects(broker.getAuthorizedConnection({actorId:'a',projectId:'p',service:'github',write:true}),/WRITE_DISABLED/);
  const ctx = await broker.getAuthorizedConnection({actorId:'a',projectId:'p',service:'github'});
  assert.equal(ctx.credential.token.access_token,'ghu_TESTSECRET');
});

test('Jira: OAuth 3LO, somente sites autorizados e token fora do frontend', async () => {
  const {broker,calls} = environment();
  const {flow} = await authorize(broker,'jira');
  const url = new URL(flow.url);
  assert.equal(url.hostname,'auth.atlassian.com');
  assert.match(url.searchParams.get('scope'),/offline_access/);
  assert.equal(url.searchParams.get('audience'),'api.atlassian.com');
  const state = broker.status({actorId:'a',attemptId:flow.attemptId});
  assert.deepEqual(state.resources.map(x=>x.id),['site-1']);
  assert.ok(!JSON.stringify(state).includes('jira-secret'));
  assert.equal(JSON.parse(calls[0].init.body).grant_type,'authorization_code');
  assert.ok(calls.some(x=>x.url.endsWith('/accessible-resources')));
  await broker.link({actorId:'a',attemptId:flow.attemptId,resourceId:'site-1'});
  const c = await broker.getAuthorizedConnection({actorId:'a',projectId:'p',service:'jira'});
  assert.equal(c.resource.url,'https://demo.atlassian.net');
});

test('Windows macOS e Linux: lógica independe do sistema operacional', async () => {
  for (const target of ['win32','darwin','linux']) {
    const {broker} = environment();
    const {flow} = await authorize(broker,'jira','user-'+target,'workspace');
    const s=broker.status({actorId:'user-'+target,attemptId:flow.attemptId});
    assert.equal(s.state,'READY');
    await broker.link({actorId:'user-'+target,attemptId:flow.attemptId,resourceId:'site-1'});
    await broker.toggle({actorId:'user-'+target,projectId:'workspace',service:'jira',active:false});
    await assert.rejects(broker.getAuthorizedConnection({actorId:'user-'+target,projectId:'workspace',service:'jira'}),/SERVICE_DISABLED/);
    await broker.toggle({actorId:'user-'+target,projectId:'workspace',service:'jira',active:true});
    assert.ok((await broker.getAuthorizedConnection({actorId:'user-'+target,projectId:'workspace',service:'jira'})).credential);
    await broker.unlink({actorId:'user-'+target,projectId:'workspace',service:'jira'});
    await assert.rejects(broker.getAuthorizedConnection({actorId:'user-'+target,projectId:'workspace',service:'jira'}),/SERVICE_DISABLED/);
  }
});

test('state inválido, replay, conta cruzada, expiração e recusa', async () => {
  const {broker,calls} = environment();
  const f=broker.start({actorId:'owner',projectId:'workspace',service:'github'});
  await assert.rejects(broker.complete({service:'github',state:'invalid',code:'x'}),/STATE_INVALID/);
  assert.throws(()=>broker.status({actorId:'intruder',attemptId:f.attemptId}),/ATTEMPT_NOT_FOUND/);
  const state = new URL(f.url).searchParams.get('state');
  assert.deepEqual(await broker.complete({service:'github',state,error:'access_denied'}),{status:'DENIED'});
  await assert.rejects(broker.complete({service:'github',state,code:'x'}),/STATE_INVALID/);
  assert.equal(calls.length,0);
  let now=1000;
  const e=environment({clock:()=>now});
  const exp=e.broker.start({actorId:'a',projectId:'p',service:'jira'});
  now += 6*60_000;
  assert.throws(()=>e.broker.status({actorId:'a',attemptId:exp.attemptId}),/ATTEMPT_NOT_FOUND/);
  await assert.rejects(e.broker.complete({service:'jira',state:new URL(exp.url).searchParams.get('state'),code:'x'}),/STATE_INVALID/);
});

test('callback HTTPS obrigatório e Qase sem OAuth inventado', () => {
  const {broker} = environment();
  const q=broker.qaseGuidance();
  assert.equal(q.mode,'API_TOKEN');
  assert.match(q.url,/qase/);
  assert.throws(()=>broker.start({actorId:'a',projectId:'p',service:'qase'}),/OAUTH_NOT_SUPPORTED/);
  const c=structuredClone(config);
  c.jira.callbackUrl='http://localhost:8080/callback';
  assert.throws(()=>createOAuthBroker({config:c,vault:{put(){},get(){},delete(){}},links:{put(){},get(){},delete(){}}}).start({actorId:'a',projectId:'p',service:'jira'}),/HTTPS/);
});

test('concorrência: callback consome state uma única vez', async () => {
  const {broker} = environment({slow:true});
  const f=broker.start({actorId:'u',projectId:'p',service:'github'});
  const state=new URL(f.url).searchParams.get('state');
  const [a,b]=await Promise.allSettled([
    broker.complete({service:'github',state,code:'ok'}),
    broker.complete({service:'github',state,code:'ok'})
  ]);
  assert.equal([a,b].filter(x=>x.status==='fulfilled').length,1);
  assert.equal([a,b].filter(x=>x.status==='rejected').length,1);
});
