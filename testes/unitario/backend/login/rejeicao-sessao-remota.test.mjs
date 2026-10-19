import test from 'node:test';
import assert from 'node:assert/strict';
import {entrarRemotamente,sairRemotamente,validarSessaoRemota} from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';

test('senha aceita mas conta nao verificada revoga cookie e nao abre sessao', async t => {
  const anterior=process.env.PRUMO_AUTH_API_URL;
  const buscar=globalThis.fetch;
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  let saidas=0;
  let modo='nao-verificado';
  globalThis.fetch=async (url, opcoes={}) => {
    const rota=new URL(url).pathname;
    if(rota==='/api/auth/sign-in/email'){
      return new Response('{}',{headers:{
        'Content-Type':'application/json',
        'set-cookie':'__Secure-better-auth.session_token=token-ficticio-123; HttpOnly; Secure; Path=/'
      }});
    }
    if(rota==='/api/auth/get-session'){
      assert.match(opcoes.headers.Cookie,/session_token=token-ficticio-123/);
      if(modo==='offline')return Response.json({erro:'unavailable'},{status:503});
      return Response.json({
        user:{id:'identidade123456',email:'pessoa@example.com',name:'Pessoa',emailVerified:false},
        session:{expiresAt:new Date(Date.now()+3600000).toISOString()}
      });
    }
    if(rota==='/api/auth/sign-out'){
      assert.match(opcoes.headers.Cookie,/session_token=token-ficticio-123/);
      saidas++;
      return Response.json({success:true});
    }
    throw Error('UNEXPECTED_REMOTE_ENDPOINT');
  };
  t.after(async()=>{
    await sairRemotamente();
    encerrarSessao();
    globalThis.fetch=buscar;
    if(anterior===undefined)delete process.env.PRUMO_AUTH_API_URL;
    else process.env.PRUMO_AUTH_API_URL=anterior;
  });

  await assert.rejects(()=>entrarRemotamente('pessoa@example.com','senha-ficticia-123'),/IDENTITY_INVALID/);
  assert.equal(saidas,1,'cookie de conta nao verificada foi revogado remotamente');
  await assert.rejects(()=>validarSessaoRemota(),/SESSION_REQUIRED/);

  modo='offline';
  await assert.rejects(()=>entrarRemotamente('pessoa@example.com','senha-ficticia-123'),/IDENTITY_SERVICE_UNAVAILABLE/);
  assert.equal(saidas,2,'falha de consulta remota tambem revoga cookie');
  await assert.rejects(()=>validarSessaoRemota(),/SESSION_REQUIRED/);
});
