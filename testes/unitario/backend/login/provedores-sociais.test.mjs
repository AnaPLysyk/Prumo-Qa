import test from 'node:test';
import assert from 'node:assert/strict';
import {provedoresSociais} from '../../../../backend/login/regras/provedoresSociais.mjs';

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
