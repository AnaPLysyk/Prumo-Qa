import test from 'node:test';
import assert from 'node:assert/strict';
import {conferirAmbienteDeAutenticacao,criarAutenticacao} from '../../../../backend/login/servidor/autenticacao.mjs';
import {enderecoDeAutenticacao,entrarRemotamente,pedirRecuperacaoRemota,sairRemotamente,validarSessaoRemota} from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import {entrarComIdentidadeRemota,idLocalDeIdentidadeRemota} from '../../../../dist/login/regras/entradaPorProvedor.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';
import {conferirAcessoAoCanal} from '../../../../dist/login/regras/conferirAcessoAoCanal.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('IPC central bloqueia criação de admin local e rotas antigas mesmo sem conta no computador',()=>{
  const antiga=process.env.PRUMO_AUTH_API_URL;
  process.env.PRUMO_AUTH_API_URL='https://prumo-qa-auth-dev.onrender.com';
  try{
    for(const canal of ['usuarios:ativar','acesso:github','conta:googleiniciar','conta:recuperar','conta:confirmarentrada'])
      assert.throws(()=>conferirAcessoAoCanal(canal),/LOGIN_METHOD_DISABLED/);
  }finally{
    if(antiga===undefined)delete process.env.PRUMO_AUTH_API_URL;
    else process.env.PRUMO_AUTH_API_URL=antiga;
  }
});
test('servidor recusa inicialização sem HTTPS, banco, segredo e envio de e-mail',()=>{
  assert.throws(()=>conferirAmbienteDeAutenticacao({}),/AUTH_URL_REQUIRED/);
  assert.throws(()=>conferirAmbienteDeAutenticacao({BETTER_AUTH_URL:'http://exemplo.com'}),/AUTH_HTTPS_REQUIRED/);
  assert.throws(()=>conferirAmbienteDeAutenticacao({BETTER_AUTH_URL:'https://auth.example.com'}),/AUTH_DATABASE_REQUIRED/);
  assert.throws(()=>conferirAmbienteDeAutenticacao({BETTER_AUTH_URL:'https://auth.example.com',DATABASE_URL:'postgresql://example:5432/db'}),/AUTH_SECRET_REQUIRED/);
  assert.equal(conferirAmbienteDeAutenticacao({
    BETTER_AUTH_URL:'https://auth.example.com',DATABASE_URL:'postgresql://example:5432/db',
    BETTER_AUTH_SECRET:'x'.repeat(48),RESEND_API_KEY:'teste',PRUMO_EMAIL_REMETENTE:'teste@example.com'
  }).baseURL,'https://auth.example.com');
});
test('Better Auth monta o handler Node sobre PostgreSQL sem abrir conexão antes do pedido',async()=>{
  const c=criarAutenticacao({env:{BETTER_AUTH_URL:'https://auth.example.com',DATABASE_URL:'postgresql://teste:teste@127.0.0.1:5432/teste',BETTER_AUTH_SECRET:'z'.repeat(48),RESEND_API_KEY:'teste',PRUMO_EMAIL_REMETENTE:'teste@example.com'},enviar:async()=>{}});
  assert.equal(typeof c.atender,'function');
  await c.fechar();
});
test('login remoto confere sessão no servidor sem expor o cookie e separa as duas identidades',async t=>{
  const antiga=process.env.PRUMO_AUTH_API_URL,baseAntigo=process.env.PRUMO_DATA_DIR,buscar=globalThis.fetch;
  const raiz=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-auth-pg-'));
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';process.env.PRUMO_DATA_DIR=raiz;
  const acesso=[],vencimento=new Date(Date.now()+3600000).toISOString();
  globalThis.fetch=async (url,opcoes)=>{
    acesso.push({path:new URL(url).pathname,temSenha:JSON.stringify(opcoes?.body||'').includes('secret-pass')});
    if(url.endsWith('/sign-in/email')){
      assert.equal(JSON.parse(opcoes.body).rememberMe,false);
      return new Response(JSON.stringify({user:{id:'useridTeste123',email:'pessoa@example.com'}}),{
        headers:{'Content-Type':'application/json','set-cookie':'__Secure-better-auth.session_token=teste123; Path=/; HttpOnly; Secure; SameSite=Lax'}});
    }
    if(url.endsWith('/get-session')){
      assert.match(opcoes.headers.Cookie,/session_token=teste123/);
      return Response.json({session:{expiresAt:vencimento},user:{id:'useridTeste123',email:'pessoa@example.com',name:'Pessoa teste',emailVerified:true}});
    }
    if(url.endsWith('/request-password-reset'))return Response.json({status:true});
    if(url.endsWith('/sign-out'))return Response.json({success:true});
    throw new Error('URL inesperada');
  };
  t.after(async()=>{await sairRemotamente();encerrarSessao();globalThis.fetch=buscar;
    if(antiga===undefined)delete process.env.PRUMO_AUTH_API_URL;else process.env.PRUMO_AUTH_API_URL=antiga;
    if(baseAntigo===undefined)delete process.env.PRUMO_DATA_DIR;else process.env.PRUMO_DATA_DIR=baseAntigo;
    fs.rmSync(raiz,{recursive:true,force:true});});
  assert.equal(enderecoDeAutenticacao(),'https://auth.example.com');
  const usuario=await entrarRemotamente('pessoa@example.com','secret-pass123');
  assert.equal(usuario.id,'useridTeste123');
  assert.equal(usuario.emailVerified,true);
  assert.equal(JSON.stringify(usuario).includes('session_token'),false);
  const sessao=entrarComIdentidadeRemota(usuario,raiz);
  assert.equal(sessao.usuario?.admin,false);
  assert.equal(sessao.usuario?.id,idLocalDeIdentidadeRemota('useridTeste123'));
  await validarSessaoRemota();
  assert.equal((await pedirRecuperacaoRemota('pessoa@example.com')).enviado,true);
  await sairRemotamente();
  assert.ok(acesso.some(x=>x.path==='/api/auth/sign-out'));
});
