/** Fala com o Google só nos dois endereços fixos do login: troca o código pelo token e lê quem acabou de autorizar. */
import { chamarHttps } from './chamarHttps.js';

const ERRO = 'GOOGLE_LOGIN_FAILED';

/** Troca o código de autorização (com o verificador PKCE) pelo token de acesso. O token vale só para ler o perfil e é descartado em seguida. */
export async function trocarCodigoNoGoogle(p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string }): Promise<string> {
  const corpo = new URLSearchParams({ client_id: p.clientId, client_secret: p.clientSecret, code: p.code, code_verifier: p.codeVerifier, grant_type: 'authorization_code', redirect_uri: p.redirectUri }).toString();
  const r = await chamarHttps(ERRO, 'oauth2.googleapis.com', '/token', 'POST', { 'Content-Type': 'application/x-www-form-urlencoded' }, corpo);
  const j = (r.json ?? {}) as { access_token?: unknown; error?: unknown };
  if (r.status !== 200 || typeof j.access_token !== 'string' || !j.access_token) throw new Error(ERRO + ': o Google recusou a autorização' + (typeof j.error === 'string' ? ' (' + j.error.slice(0, 40) + ')' : '') + '.');
  return j.access_token;
}

/** Quem autorizou: `sub` (a identidade que vale, nunca o e-mail), parte local do e-mail como login e o nome. */
export async function lerPerfilDoGoogle(token: string): Promise<{ id: string; login: string; nome: string | null }> {
  const r = await chamarHttps(ERRO, 'openidconnect.googleapis.com', '/v1/userinfo', 'GET', { Authorization: 'Bearer ' + token });
  const j = (r.json ?? {}) as { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };
  if (r.status !== 200 || typeof j.sub !== 'string' || !/^[0-9]{1,30}$/.test(j.sub)) throw new Error(ERRO + ': não foi possível ler o perfil do Google.');
  const email = typeof j.email === 'string' ? j.email : ''; const login = (email.split('@')[0] || 'usuario').slice(0, 60);
  return { id: j.sub, login, nome: typeof j.name === 'string' && j.name.trim() ? j.name.trim().slice(0, 80) : null, ...(j.email_verified === true && email ? { email } : {}) };
}
