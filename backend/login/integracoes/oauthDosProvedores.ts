/** Autenticação OAuth: identidade GitHub e Google sem vincular repositórios. */
import { chamarHttps } from "./chamarHttps.js";

// githubOauth — responsabilidade deste trecho
const ERRO_GITHUB = 'GITHUB_LOGIN_FAILED';

/** Troca o código de autorização (com o verificador PKCE) pelo token de acesso. O token nunca é registrado em log. */
export async function trocarCodigoNoGithub(p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string }): Promise<string> {
  const r = await chamarHttps(ERRO_GITHUB, 'github.com', '/login/oauth/access_token', 'POST', { 'Content-Type': 'application/json' }, JSON.stringify({ client_id: p.clientId, client_secret: p.clientSecret, code: p.code, redirect_uri: p.redirectUri, code_verifier: p.codeVerifier }));
  const j = (r.json ?? {}) as { access_token?: unknown; error?: unknown };
  if (r.status !== 200 || typeof j.access_token !== 'string' || !j.access_token) throw new Error(ERRO_GITHUB + ': o GitHub recusou a autorização' + (typeof j.error === 'string' ? ' (' + j.error.slice(0, 40) + ')' : '') + '.');
  return j.access_token;
}

/** Quem autorizou: id numérico (a identidade que vale), login e nome. */
export async function lerPerfilDoGithub(token: string): Promise<{ id: string; login: string; nome: string | null }> {
  const r = await chamarHttps(ERRO_GITHUB, 'api.github.com', '/user', 'GET', { Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' });
  const j = (r.json ?? {}) as { id?: unknown; login?: unknown; name?: unknown };
  if (r.status !== 200 || typeof j.id !== 'number' || !Number.isSafeInteger(j.id) || typeof j.login !== 'string' || !j.login) throw new Error(ERRO_GITHUB + ': não foi possível ler o perfil do GitHub.');
  return { id: String(j.id), login: j.login.slice(0, 60), nome: typeof j.name === 'string' && j.name.trim() ? j.name.trim().slice(0, 80) : null };
}

// googleOauth — responsabilidade deste trecho
const ERRO_GOOGLE = 'GOOGLE_LOGIN_FAILED';

/** Troca o código de autorização (com o verificador PKCE) pelo token de acesso. O token vale só para ler o perfil e é descartado em seguida. */
export async function trocarCodigoNoGoogle(p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string }): Promise<string> {
  const corpo = new URLSearchParams({ client_id: p.clientId, client_secret: p.clientSecret, code: p.code, code_verifier: p.codeVerifier, grant_type: 'authorization_code', redirect_uri: p.redirectUri }).toString();
  const r = await chamarHttps(ERRO_GOOGLE, 'oauth2.googleapis.com', '/token', 'POST', { 'Content-Type': 'application/x-www-form-urlencoded' }, corpo);
  const j = (r.json ?? {}) as { access_token?: unknown; error?: unknown };
  if (r.status !== 200 || typeof j.access_token !== 'string' || !j.access_token) throw new Error(ERRO_GOOGLE + ': o Google recusou a autorização' + (typeof j.error === 'string' ? ' (' + j.error.slice(0, 40) + ')' : '') + '.');
  return j.access_token;
}

/** Quem autorizou: `sub` (a identidade que vale, nunca o e-mail), parte local do e-mail como login e o nome. */
export async function lerPerfilDoGoogle(token: string): Promise<{ id: string; login: string; nome: string | null }> {
  const r = await chamarHttps(ERRO_GOOGLE, 'openidconnect.googleapis.com', '/v1/userinfo', 'GET', { Authorization: 'Bearer ' + token });
  const j = (r.json ?? {}) as { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };
  if (r.status !== 200 || typeof j.sub !== 'string' || !/^[0-9]{1,30}$/.test(j.sub)) throw new Error(ERRO_GOOGLE + ': não foi possível ler o perfil do Google.');
  const email = typeof j.email === 'string' ? j.email : ''; const login = (email.split('@')[0] || 'usuario').slice(0, 60);
  return { id: j.sub, login, nome: typeof j.name === 'string' && j.name.trim() ? j.name.trim().slice(0, 80) : null, ...(j.email_verified === true && email ? { email } : {}) };
}
