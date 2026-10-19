import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {contaSessao} from '../../../../dist/login/api/contaSessao.js';
import {entrarRemotamente,sairRemotamente} from '../../../../dist/login/integracoes/autenticacaoRemota.js';
import {entrarComIdentidadeRemota} from '../../../../dist/login/regras/entrarComIdentidadeRemota.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';

test('polling detecta sessão revogada no servidor e invalida sessão local', async t => {
  const authAnterior=process.env.PRUMO_AUTH_API_URL;
  const dadosAnteriores=process.env.PRUMO_DATA_DIR;
  const fetchAnterior=globalThis.fetch;
  const dados=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-revogacao-'));
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  process.env.PRUMO_DATA_DIR=dados;
  let consultas=0;
  globalThis.fetch=async (url,opcoes) => {
    const caminho=new URL(url).pathname;
    if(caminho==='/api/auth/sign-in/email')return new Response('{}',{
      headers:{'Content-Type':'application/json',
        'set-cookie':'__Secure-better-auth.session_token=teste123; Path=/; HttpOnly; Secure; SameSite=Lax'}
    });
    if(caminho==='/api/auth/get-session'){
      consultas++;
      if(consultas>1)return new Response('{}',{status:401});
      assert.match(opcoes.headers.Cookie,/session_token=teste123/);
      return Response.json({
        session:{expiresAt:new Date(Date.now()+3600000).toISOString()},
        user:{id:'identidadeRemota123',email:'pessoa@example.com',name:'Pessoa',emailVerified:true}
      });
    }
    if(caminho==='/api/auth/sign-out')return Response.json({success:true});
    throw Error('ENDPOINT_UNEXPECTED');
  };
  t.after(async () => {
    await sairRemotamente();encerrarSessao();globalThis.fetch=fetchAnterior;
    if(authAnterior===undefined)delete process.env.PRUMO_AUTH_API_URL;
    else process.env.PRUMO_AUTH_API_URL=authAnterior;
    if(dadosAnteriores===undefined)delete process.env.PRUMO_DATA_DIR;
    else process.env.PRUMO_DATA_DIR=dadosAnteriores;
    fs.rmSync(dados,{recursive:true,force:true});
  });
  const identidade=await entrarRemotamente('pessoa@example.com','secret-pass123');
  const local=entrarComIdentidadeRemota(identidade,dados);
  assert.ok(local.usuario,'conta autenticada antes da revogação');
  const resposta=await contaSessao();
  assert.equal(resposta.identidadeRemota,true);
  assert.equal(resposta.loginAtivo,true);
  assert.equal(resposta.usuario,null,'consulta pública não conserva conta revogada');
  assert.equal(consultas,2,'sessão revalidada no servidor após login');
});
