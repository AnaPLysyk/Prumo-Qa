import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {oauthDesktopAtivo, origensOAuthDesktop, ESQUEMA_OAUTH_DESKTOP} from '../../../../backend/login/regras/oauthDesktop.mjs';
import {criarAutenticacao} from '../../../../backend/login/servidor/autenticacao.mjs';

const ambiente = {
  BETTER_AUTH_URL:'https://auth.example.test',
  DATABASE_URL:'postgresql://falso:falso@127.0.0.1:5432/nao-conectar',
  BETTER_AUTH_SECRET:'um-segredo-ficticio-usado-apenas-nos-testes-123456789',
  RESEND_API_KEY:'re_ficticio',
  PRUMO_EMAIL_REMETENTE:'teste@example.test'
};

test('protocolo desktop usa um único identificador e só ativa com aprovação explícita', () => {
  assert.equal(ESQUEMA_OAUTH_DESKTOP, 'com.anaplysyk.prumoqa');
  assert.equal(oauthDesktopAtivo({}), false);
  assert.equal(oauthDesktopAtivo({PRUMO_OAUTH_DESKTOP_ATIVO:'sim'}), false);
  assert.equal(oauthDesktopAtivo({PRUMO_OAUTH_DESKTOP_ATIVO:'SIM'}), true);
  assert.deepEqual(origensOAuthDesktop({}), []);
  assert.deepEqual(origensOAuthDesktop({PRUMO_OAUTH_DESKTOP_ATIVO:'SIM'}), ['com.anaplysyk.prumoqa:/']);
});

test('plugin Better Auth Electron fica ausente por padrão e só entra no servidor com autorização', async () => {
  for (const ativo of [false, true]) {
    const env = {...ambiente, ...(ativo ? {PRUMO_OAUTH_DESKTOP_ATIVO:'SIM'} : {})};
    const instancia = criarAutenticacao({env, enviar:async()=>{}});
    try {
      assert.equal(instancia.auth.options.plugins.some(p=>p.id==='electron'), ativo);
      assert.deepEqual(instancia.auth.options.trustedOrigins, ativo ? ['com.anaplysyk.prumoqa:/'] : []);
    } finally {
      await instancia.fechar();
    }
  }
});

test('instaladores registram esquema de OAuth sem inserir senhas na configuração', () => {
  const yaml=fs.readFileSync(new URL('../../../../electron-builder.yml', import.meta.url),'utf8');
  assert.match(yaml,/^protocols:\s*\n\s+- name: Prumo QA Identity\s*\n\s+schemes:\s*\n\s+- com\.anaplysyk\.prumoqa$/m);
  assert.doesNotMatch(yaml,/GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET|BETTER_AUTH_SECRET/);
});
