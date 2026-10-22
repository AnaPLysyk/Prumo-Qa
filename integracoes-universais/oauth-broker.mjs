/** OAuth broker multi-OS: core Node sem Electron e sem credenciais no frontend.
 * INTEGRAÇÃO: forneça auth de sessão, vault criptografado persistente e repositório de vínculos.
 * O armazenamento em memória aqui cobre apenas tentativas efêmeras (exige store compartilhado em produção).
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const random = () => randomBytes(32).toString('base64url');
const required = (value, code) => { if (typeof value !== 'string' || !value.trim()) throw Error(code); return value; };
const jsonResponse = async (res, code) => {
  if (!res.ok) throw Error(code + '_HTTP_' + res.status);
  const data = await res.json();
  if (!data || typeof data !== 'object') throw Error(code + '_INVALID_RESPONSE');
  return data;
};
const prove = (a, b) => {
  const x = Buffer.from(a || ''), y = Buffer.from(b || '');
  return x.length === y.length && timingSafeEqual(x, y);
};
const cleanString = (s, max = 200) => String(s ?? '').slice(0, max);

function configFor(kind, config) {
  const c = config[kind];
  if (!c || !c.clientId || !c.clientSecret || !c.callbackUrl) throw Error(kind.toUpperCase() + '_NOT_CONFIGURED');
  const u = new URL(c.callbackUrl);
  if (u.protocol !== 'https:') throw Error('CALLBACK_MUST_USE_HTTPS');
  return c;
}

export function createOAuthBroker({ config, fetcher = fetch, vault, links, now = () => Date.now(), attemptStore = new Map() }) {
  if (!vault?.put || !vault?.get || !vault?.delete || !links?.put || !links?.get || !links?.delete) {
    throw Error('PERSISTENT_SECURE_ADAPTERS_REQUIRED');
  }
  const exposed = a => ({ attemptId: a.id, state: a.status, service: a.service,
    resources: a.status === 'READY' ? a.resources : undefined, error: a.error });
  const own = (actor, id) => {
    const a = attemptStore.get(id);
    if (!a || a.actorId !== actor || a.deadline < now()) throw Error('ATTEMPT_NOT_FOUND');
    return a;
  };
  const providerAuth = (service, c, a) => {
    if (service === 'github') {
      return 'https://github.com/login/oauth/authorize?' + new URLSearchParams({
        client_id: c.clientId, redirect_uri: c.callbackUrl, state: a.state,
        code_challenge: a.challenge, code_challenge_method: 'S256'
        // GitHub App permissions are configured at registration, never via repo OAuth scopes.
      });
    }
    return 'https://auth.atlassian.com/authorize?' + new URLSearchParams({
      audience: 'api.atlassian.com', client_id: c.clientId, scope: 'read:jira-work read:jira-user offline_access',
      redirect_uri: c.callbackUrl, state: a.state, response_type: 'code', prompt: 'consent'
    });
  };

  async function requestToken(service, c, a, code) {
    const github = service === 'github';
    const response = await fetcher(github ? 'https://github.com/login/oauth/access_token' : 'https://auth.atlassian.com/oauth/token', {
      method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(github
        ? { client_id: c.clientId, client_secret: c.clientSecret, code,
            redirect_uri: c.callbackUrl, code_verifier: a.verifier }
        : { grant_type: 'authorization_code', client_id: c.clientId, client_secret: c.clientSecret,
            code, redirect_uri: c.callbackUrl })
    });
    const token = await jsonResponse(response, service.toUpperCase() + '_TOKEN');
    if (token.error || !token.access_token || typeof token.access_token !== 'string') throw Error('TOKEN_EXCHANGE_FAILED');
    return token;
  }

  async function lookup(service, accessToken) {
    const headers = { 'Authorization': 'Bearer ' + accessToken, 'Accept': 'application/json',
      ...(service === 'github' ? { 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Prumo-QA' } : {}) };
    if (service === 'jira') {
      const res = await jsonResponse(await fetcher('https://api.atlassian.com/oauth/token/accessible-resources', { headers }), 'JIRA_RESOURCES');
      if (!Array.isArray(res)) throw Error('JIRA_RESOURCES_INVALID');
      return { identity: null, resources: res.filter(x => typeof x.id === 'string' && typeof x.url === 'string')
        .map(x => ({ id: x.id, name: cleanString(x.name), url: cleanString(x.url), kind: 'site', scopes: Array.isArray(x.scopes) ? x.scopes : [] })) };
    }
    const user = await jsonResponse(await fetcher('https://api.github.com/user', { headers }), 'GITHUB_IDENTITY');
    const pages = await jsonResponse(await fetcher('https://api.github.com/user/installations?per_page=100', { headers }), 'GITHUB_INSTALLATIONS');
    if (!user.id || !Array.isArray(pages.installations)) throw Error('GITHUB_IDENTITY_INVALID');
    const repos = [];
    for (const item of pages.installations.slice(0, 20)) {
      if (!Number.isSafeInteger(item.id)) continue;
      const r = await jsonResponse(await fetcher('https://api.github.com/user/installations/' + item.id + '/repositories?per_page=100', { headers }), 'GITHUB_REPOSITORIES');
      if (Array.isArray(r.repositories)) for (const repo of r.repositories) {
        if (Number.isSafeInteger(repo.id) && repo.full_name)
          repos.push({ id: String(repo.id), name: cleanString(repo.full_name), kind: 'repository', installationId: String(item.id) });
      }
    }
    return { identity: { id: String(user.id), login: cleanString(user.login) }, resources: repos.slice(0, 1000) };
  }

  return {
    /** Deve ser chamado somente depois da autenticação do usuário no servidor Prumo. */
    start({ actorId, projectId, service }) {
      required(actorId, 'AUTH_REQUIRED'); required(projectId, 'PROJECT_REQUIRED');
      if (!['github', 'jira'].includes(service)) throw Error('OAUTH_NOT_SUPPORTED');
      const c = configFor(service, config), id = random(), state = random(), verifier = random();
      const a = { id, actorId, projectId, service, state, verifier,
        challenge: createHash('sha256').update(verifier).digest('base64url'),
        status: 'PENDING', deadline: now() + 5 * 60_000 };
      attemptStore.set(id, a);
      return { attemptId: id, service, url: providerAuth(service, c, a) };
    },
    /** A callback recebe SOMENTE code/state. Não retorna token ao browser. */
    async complete({ service, state, code, error }) {
      const a = [...attemptStore.values()].find(x => x.service === service && prove(x.state, state));
      if (!a || a.deadline < now() || a.status !== 'PENDING') throw Error('OAUTH_STATE_INVALID');
      // Consume antes de chamar o provedor para rejeitar repetição/race.
      a.status = 'PROCESSING';
      if (error || !code) { a.status = 'DENIED'; return { status: 'DENIED' }; }
      try {
        const token = await requestToken(service, configFor(service, config), a, code);
        const { identity, resources } = await lookup(service, token.access_token);
        const connectionId = random();
        await vault.put({ actorId: a.actorId, connectionId, service,
          token: { ...token, obtainedAt: now() }, identity });
        a.resources = resources; a.connectionId = connectionId;
        a.status = 'READY'; delete a.verifier; delete a.state;
        return { status: 'READY' };
      } catch {
        a.status = 'ERROR'; a.error = 'Falha ao concluir autorização ou consultar recursos.';
        delete a.verifier; delete a.state;
        return { status: 'ERROR' };
      }
    },
    status({ actorId, attemptId }) { return exposed(own(actorId, attemptId)); },
    /** Vínculo somente ao recurso selecionado e autorizado. Sem escrita por padrão. */
    async link({ actorId, attemptId, resourceId }) {
      const a = own(actorId, attemptId);
      if (a.status !== 'READY') throw Error('AUTH_NOT_COMPLETE');
      const resource = a.resources?.find(r => r.id === String(resourceId));
      if (!resource) throw Error('RESOURCE_NOT_AUTHORIZED');
      const linked = { actorId, projectId: a.projectId, service: a.service,
        connectionId: a.connectionId, resource, active: true, writeEnabled: false };
      await links.put(linked);
      a.status = 'LINKED'; delete a.resources;
      return { service: linked.service, resource, active: true, writeEnabled: false };
    },
    async toggle({ actorId, projectId, service, active }) {
      if (typeof active !== 'boolean') throw Error('INVALID_STATE');
      const l = await links.get({ actorId, projectId, service });
      if (!l) throw Error('LINK_NOT_FOUND');
      await links.put({ ...l, active }); return { service, active };
    },
    async unlink({ actorId, projectId, service }) {
      await links.delete({ actorId, projectId, service });
      return { unlinked: true }; // Histórico e credenciais compartilhadas de outra vinculação preservados.
    },
    async getAuthorizedConnection({ actorId, projectId, service, write = false }) {
      const l = await links.get({ actorId, projectId, service });
      if (!l || !l.active) throw Error('SERVICE_DISABLED_OR_UNLINKED');
      if (write && !l.writeEnabled) throw Error('WRITE_DISABLED');
      const credential = await vault.get({ actorId, connectionId: l.connectionId });
      if (!credential) throw Error('ACCOUNT_DISCONNECTED');
      return { resource: l.resource, credential }; // Somente chamada no backend, nunca via IPC.
    },
    /** Qase não fornece OAuth público documentado. Página oficial e token único, sem fingir conexão OAuth. */
    qaseGuidance() { return { mode: 'API_TOKEN', url: 'https://app.qase.io/user/api/token',
      message: 'Crie um App Token ou Personal Token. O Prumo validará e protegerá a credencial no cofre.' }; }
  };
}
