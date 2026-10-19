import test from 'node:test';
import assert from 'node:assert/strict';
import {provedoresSociais} from '../../../../backend/login/regras/provedoresSociais.mjs';
import {criarAutenticacao} from '../../../../backend/login/servidor/autenticacao.mjs';

test('sem credenciais completas os provedores não aparecem', () => {
  assert.deepEqual(provedoresSociais({}), {});
  assert.deepEqual(provedoresSociais({GITHUB_CLIENT_ID:'apenas-id'}), {});
  assert.deepEqual(provedoresSociais({GOOGLE_CLIENT_SECRET:'apenas-segredo'}), {});
});

test('GitHub pede identidade e e-mail, nunca acesso a repositórios', () => {
  const providers=provedoresSociais({GITHUB_CLIENT_ID:'github-id',GITHUB_CLIENT_SECRET:'github-private'});
  assert.deepEqual(Object.keys(providers), ['github']);
  assert.deepEqual(providers.github.scope, ['read:user','user:email']);
  assert.equal(providers.github.scope.includes('repo'),false);
  assert.equal(providers.github.clientId,'github-id');
});

test('Google e GitHub são habilitados por pares independentes e sem variáveis no cliente', () => {
  const env={GITHUB_CLIENT_ID:'gh-id',GITHUB_CLIENT_SECRET:'gh-private',GOOGLE_CLIENT_ID:'google-id',GOOGLE_CLIENT_SECRET:'google-private'};
  const providers=provedoresSociais(env);
  assert.deepEqual(Object.keys(providers).sort(), ['github','google']);
  assert.deepEqual(Object.keys(providers.google).sort(), ['clientId','clientSecret']);
  assert.equal(provedoresSociais({...env,GOOGLE_CLIENT_SECRET:'  '}).google,undefined);
  assert.ok(provedoresSociais({...env,GOOGLE_CLIENT_SECRET:'  '}).github);
});

test('Better Auth registra provedores no servidor sem abrir sessão ou consultar o banco', async () => {
  const env = {
    BETTER_AUTH_URL:'https://auth.example.com',
    DATABASE_URL:'postgresql://fake:fake@127.0.0.1:5432/nao_conectar',
    BETTER_AUTH_SECRET:'a'.repeat(48),
    RESEND_API_KEY:'chave-ficticia',
    PRUMO_EMAIL_REMETENTE:'teste@example.com',
    GITHUB_CLIENT_ID:'github-server-id',
    GITHUB_CLIENT_SECRET:'github-server-private',
    GOOGLE_CLIENT_ID:'google-server-id',
    GOOGLE_CLIENT_SECRET:'google-server-private'
  };
  const cliente=criarAutenticacao({env,enviar:async()=>{}});
  try {
    assert.deepEqual(Object.keys(cliente.auth.options.socialProviders).sort(), ['github','google']);
    assert.equal(cliente.auth.options.socialProviders.github.clientId,'github-server-id');
    assert.equal(typeof cliente.atender,'function');
  } finally {
    await cliente.fechar();
  }
});
