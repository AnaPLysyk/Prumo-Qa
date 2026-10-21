import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {criarAutenticacao} from '../../../../backend/login/servidor/autenticacao.mjs';

test('limite de tentativas identifica cada pessoa pelo IP que a Cloudflare do Render repassa',async()=>{
  const c=criarAutenticacao({env:{BETTER_AUTH_URL:'https://auth.example.com',DATABASE_URL:'postgresql://teste:teste@127.0.0.1:5432/teste',BETTER_AUTH_SECRET:'z'.repeat(48),RESEND_API_KEY:'teste',PRUMO_EMAIL_REMETENTE:'teste@example.com'},enviar:async()=>{}});
  const api=createRequire(new URL('../../../../backend/login/servidor/package.json',import.meta.url)).resolve('better-auth/api');
  const {getIP}=await import(pathToFileURL(api).href);
  const pedido=cabecalhos=>new Request('https://auth.example.com/api/auth/sign-up/email',{headers:cabecalhos});
  assert.equal(getIP(pedido({'cf-connecting-ip':'203.0.113.7','x-forwarded-for':'203.0.113.7, 172.70.1.1'}),c.auth.options),'203.0.113.7');
  // X-Forwarded-For vem de quem chama e pode ser forjado: sozinho, não identifica ninguém.
  assert.notEqual(getIP(pedido({'x-forwarded-for':'198.51.100.1'}),c.auth.options),'198.51.100.1');
  await c.fechar();
});
