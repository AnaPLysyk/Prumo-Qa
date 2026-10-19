import test from 'node:test';
import assert from 'node:assert/strict';
import {entrarRemotamente,sairRemotamente,validarSessaoRemota} from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';

test('dois logins simultâneos não misturam cookies nem identidades', async t => {
  const antiga=process.env.PRUMO_AUTH_API_URL, buscar=globalThis.fetch;
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  let liberarPrimeiro;
  const primeiraResposta=new Promise(resolve => { liberarPrimeiro=resolve; });
  const logins=[];
  globalThis.fetch=async (url,opcoes={}) => {
    const rota=new URL(url).pathname;
    if(rota==='/api/auth/sign-in/email'){
      const email=JSON.parse(opcoes.body).email;
      logins.push(email);
      if(email==='primeiro@example.com')await primeiraResposta;
      const token=email.startsWith('primeiro')?'token-primeiro':'token-segundo';
      return new Response('{}',{headers:{
        'Content-Type':'application/json',
        'set-cookie':`__Secure-better-auth.session_token=${token}; Secure; HttpOnly; Path=/`
      }});
    }
    if(rota==='/api/auth/get-session'){
      const cookie=opcoes.headers?.Cookie||'';
      const primeiro=cookie.includes('token-primeiro');
      const segundo=cookie.includes('token-segundo');
      assert.ok(primeiro!==segundo,'um único cookie válido enviado');
      return Response.json({
        session:{expiresAt:new Date(Date.now()+3600000).toISOString()},
        user:{id:primeiro?'usuarioPrimeiro123':'usuarioSegundo123',
          email:primeiro?'primeiro@example.com':'segundo@example.com',
          name:'Pessoa',emailVerified:true}
      });
    }
    if(rota==='/api/auth/sign-out')return Response.json({success:true});
    throw Error('ENDPOINT_INESPERADO');
  };
  t.after(async()=>{
    liberarPrimeiro();
    await sairRemotamente();encerrarSessao();globalThis.fetch=buscar;
    if(antiga===undefined)delete process.env.PRUMO_AUTH_API_URL;
    else process.env.PRUMO_AUTH_API_URL=antiga;
  });
  const primeiro=entrarRemotamente('primeiro@example.com','senha-segura-123');
  await assert.rejects(
    ()=>entrarRemotamente('segundo@example.com','senha-segura-123'),
    /LOGIN_IN_PROGRESS/
  );
  assert.deepEqual(logins,['primeiro@example.com'],'segundo pedido bloqueado antes do servidor');
  liberarPrimeiro();
  const usuario1=await primeiro;
  assert.equal(usuario1.email,'primeiro@example.com');
  await validarSessaoRemota();
  const usuario2=await entrarRemotamente('segundo@example.com','senha-segura-123');
  assert.equal(usuario2.email,'segundo@example.com');
  assert.deepEqual(logins,['primeiro@example.com','segundo@example.com']);
});
