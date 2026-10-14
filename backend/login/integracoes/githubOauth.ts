/** Fala com o GitHub só nos dois endereços fixos do login: troca o código pelo token e lê quem acabou de autorizar. */
import { chamarHttps } from './chamarHttps.js';

const ERRO = 'GITHUB_LOGIN_FAILED';

/** Troca o código de autorização (com o verificador PKCE) pelo token de acesso. O token nunca é registrado em log. */
export async function trocarCodigoNoGithub(p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string }): Promise<string> {
  const r = await chamarHttps(ERRO, 'github.com', '/login/oauth/access_token', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ client_id: p.clientId, client_secret: p.clientSecret, code: p.code, redirect_uri: p.redirectUri, code_verifier: p.codeVerifier }));
  const j = (r.json ?? {}) as { access_token?: unknown; error?: unknown };
  if (r.status !== 200 || typeof j.access_token !== 'string' || !j.access_token) throw new Error(ERRO + ': o GitHub recusou a autorização' + (typeof j.error === 'string' ? ' (' + j.error.slice(0, 40) + ')' : '') + '.');
  return j.access_token;
}

/** Quem autorizou: id numérico (a identidade que vale), login e nome. */
export async function lerPerfilDoGithub(token: string): Promise<{ id: string; login: string; nome: string | null }> {
  const r = await chamarHttps(ERRO, 'api.github.com', '/user', 'GET', { Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' });
  const j = (r.json ?? {}) as { id?: unknown; login?: unknown; name?: unknown };
  if (r.status !== 200 || typeof j.id !== 'number' || !Number.isSafeInteger(j.id) || typeof j.login !== 'string' || !j.login) throw new Error(ERRO + ': não foi possível ler o perfil do GitHub.');
  return { id: String(j.id), login: j.login.slice(0, 60), nome: typeof j.name === 'string' && j.name.trim() ? j.name.trim().slice(0, 80) : null };
}
