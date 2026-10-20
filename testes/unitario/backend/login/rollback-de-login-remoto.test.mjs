import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {contaEntrar} from '../../../../dist/login/controladorSessao.js';
import {entrarComIdentidadeRemota} from '../../../../dist/login/regras/entradaPorProvedor.js';
import {encerrarSessao, contaDaSessao} from '../../../../dist/login/regras/sessao.js';
import {sairRemotamente, validarSessaoRemota} from '../../../../dist/login/integracoes/autenticacaoRemota.js';

test('se vinculo local falha apos login online, servidor recebe logout e nenhum usuario entra', async t => {
  const antigaUrl=process.env.PRUMO_AUTH_API_URL;
  const antigosDados=process.env.PRUMO_DATA_DIR;
  const buscar=globalThis.fetch;
  const raiz=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-login-rollback-'));
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  process.env.PRUMO_DATA_DIR=raiz;
  let saidas=0;
  let logins=0;
  globalThis.fetch=async (url,opcoes={}) => {
    const caminho=new URL(url).pathname;
    if(caminho==='/api/auth/sign-in/email'){
      logins++;
      return new Response('{}',{
        headers:{'Content-Type':'application/json',
          'set-cookie':'__Secure-better-auth.session_token=token-teste-1; HttpOnly; Secure; Path=/'}
      });
    }
    if(caminho==='/api/auth/get-session'){
      assert.match(opcoes.headers.Cookie,/session_token=token-teste-1/);
      return Response.json({
        session:{expiresAt:new Date(Date.now()+3600000).toISOString()},
        user:{id:'identidadeB45678',email:'mesmo@example.com',name:'Pessoa B',emailVerified:true}
      });
    }
    if(caminho==='/api/auth/sign-out'){
      assert.match(opcoes.headers.Cookie,/session_token=token-teste-1/);
      saidas++;
      return Response.json({success:true});
    }
    throw Error('UNEXPECTED_URL');
  };
  t.after(async()=>{
    await sairRemotamente();
    encerrarSessao();
    globalThis.fetch=buscar;
    if(antigaUrl===undefined)delete process.env.PRUMO_AUTH_API_URL;
    else process.env.PRUMO_AUTH_API_URL=antigaUrl;
    if(antigosDados===undefined)delete process.env.PRUMO_DATA_DIR;
    else process.env.PRUMO_DATA_DIR=antigosDados;
    fs.rmSync(raiz,{recursive:true,force:true});
  });
  // Conta já vinculada a outra identidade: nunca vincular automaticamente pelo e-mail.
  entrarComIdentidadeRemota({
    id:'identidadeA12345',email:'mesmo@example.com',name:'Pessoa A',emailVerified:true
  },raiz);
  encerrarSessao();
  await assert.rejects(
    () => contaEntrar({login:'mesmo@example.com',senha:'senha-ficticia-123'}),
    /IDENTITY_LINK_REQUIRED/
  );
  assert.equal(logins,1);
  assert.equal(saidas,1,'o cookie remoto deve ser revogado ao rejeitar a conta local');
  assert.equal(contaDaSessao(),null,'não cria sessão local para identidade conflitante');
  await assert.rejects(()=>validarSessaoRemota(),/SESSION_REQUIRED/);
});
