/** Login social do Prumo: credenciais só no servidor Render, nunca no Electron. */
export function provedoresSociais(env = process.env) {
  const googleId = String(env.GOOGLE_CLIENT_ID ?? '').trim();
  const googleSecret = String(env.GOOGLE_CLIENT_SECRET ?? '').trim();
  const githubId = String(env.GITHUB_CLIENT_ID ?? '').trim();
  const githubSecret = String(env.GITHUB_CLIENT_SECRET ?? '').trim();
  const providers = {};
  // Um par incompleto nunca ativa OAuth nem derruba o login por e-mail já operacional.
  if (githubId && githubSecret) {
    providers.github = {
      clientId: githubId,
      clientSecret: githubSecret,
      // Identidade e e-mail: não solicitar "repo", "workflow" ou permissões de escrita.
      scope: ['read:user', 'user:email']
    };
  }
  if (googleId && googleSecret) {
    providers.google = {
      clientId: googleId,
      clientSecret: googleSecret
    };
  }
  return providers;
}
