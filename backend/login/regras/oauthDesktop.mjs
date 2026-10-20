/** Contrato único do protocolo desktop e ativação gradual do plugin oficial. */
export const ESQUEMA_OAUTH_DESKTOP = 'com.anaplysyk.prumoqa';

/** O login social permanece desativado até existir o handoff navegador→Electron. */
export function oauthDesktopAtivo(env = process.env) {
  return env.PRUMO_OAUTH_DESKTOP_ATIVO === 'SIM';
}

export function origensOAuthDesktop(env = process.env) {
  return oauthDesktopAtivo(env) ? [ESQUEMA_OAUTH_DESKTOP + ':/'] : [];
}
