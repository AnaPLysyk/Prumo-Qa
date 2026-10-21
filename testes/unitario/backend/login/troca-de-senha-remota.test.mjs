import test from 'node:test';
import assert from 'node:assert/strict';
import {entrarRemotamente,sairRemotamente,trocarSenhaRemota} from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';

test('troca de senha na conta central usa a sessão, derruba as outras e guarda o cookie novo',async t=>{
  const authAnterior=process.env.PRUMO_AUTH_API_URL,fetchAnterior=globalThis.fetch;
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  const pedidos=[];let respostaDaTroca=()=>new Response('{}',{headers:{'Content-Type':'application/json',
    'set-cookie':'__Secure-better-auth.session_token=novo456; Path=/; HttpOnly; Secure'}});
  globalThis.fetch=async (url,opcoes)=>{
    const caminho=new URL(url).pathname;pedidos.push({caminho,opcoes});
    if(caminho==='/api/auth/sign-in/email')return new Response('{}',{headers:{'Content-Type':'application/json',
      'set-cookie':'__Secure-better-auth.session_token=antigo123; Path=/; HttpOnly; Secure'}});
    if(caminho==='/api/auth/get-session')return Response.json({session:{expiresAt:new Date(Date.now()+3600000).toISOString()},
      user:{id:'identidadeRemota123',email:'pessoa@example.com',name:'Pessoa',emailVerified:true}});
    if(caminho==='/api/auth/change-password')return respostaDaTroca();
    if(caminho==='/api/auth/sign-out')return Response.json({success:true});
    throw Error('ENDPOINT_UNEXPECTED');
  };
  t.after(async()=>{
    await sairRemotamente();encerrarSessao();globalThis.fetch=fetchAnterior;
    if(authAnterior===undefined)delete process.env.PRUMO_AUTH_API_URL;else process.env.PRUMO_AUTH_API_URL=authAnterior;
  });
  await assert.rejects(()=>trocarSenhaRemota('senha-atual-123','senha-nova-456'),/SESSION_REQUIRED/);
  await entrarRemotamente('pessoa@example.com','senha-atual-123');
  await assert.rejects(()=>trocarSenhaRemota('senha-atual-123','curta'),/PASSWORD_WEAK/);
  assert.deepEqual(await trocarSenhaRemota('senha-atual-123','senha-nova-456'),{trocada:true});
  const troca=pedidos.find(p=>p.caminho==='/api/auth/change-password');
  assert.deepEqual(JSON.parse(troca.opcoes.body),{currentPassword:'senha-atual-123',newPassword:'senha-nova-456',revokeOtherSessions:true});
  assert.match(troca.opcoes.headers.Cookie,/session_token=antigo123/);
  assert.equal(troca.opcoes.headers.Origin,'https://auth.example.com');
  // A sessão nova vale nas próximas chamadas.
  await trocarSenhaRemota('senha-nova-456','senha-nova-789');
  assert.match(pedidos.filter(p=>p.caminho==='/api/auth/change-password').at(-1).opcoes.headers.Cookie,/session_token=novo456/);
  respostaDaTroca=()=>Response.json({code:'INVALID_PASSWORD'},{status:400});
  await assert.rejects(()=>trocarSenhaRemota('errada-12345','senha-nova-000'),/PASSWORD_INVALID/);
  respostaDaTroca=()=>new Response('{}',{status:401});
  await assert.rejects(()=>trocarSenhaRemota('senha-nova-789','senha-nova-000'),/SESSION_EXPIRED/);
});
