import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {criarServico} from '../../../../backend/aplicativo/servidor/servidor.mjs';

async function atender(url,{oauthDesktop=false,autenticacao=null,method='GET'}={}) {
  let status = 0, headers = {}, conteudo = '';
  const servico=criarServico({configurado:false,enviar:async()=>{},oauthDesktop,autenticacao});
  await servico({method,url},{
    headersSent:false,
    writeHead(codigo,cabecalhos={}){status=codigo;headers=cabecalhos;},
    end(valor=''){conteudo=String(valor);}
  });
  return {status,headers,conteudo};
}
const autenticacaoFicticia={atender:async()=>{throw Error('NUNCA');},checar:async()=>{}};

test('página e script recusam acesso enquanto OAuth desktop não está habilitado',async()=>{
  for(const rota of ['/entrar-social','/entrar-social.js']) {
    for(const estado of [{oauthDesktop:false,autenticacao:autenticacaoFicticia},{oauthDesktop:true,autenticacao:null}]) {
      const r=await atender(rota,estado);
      assert.equal(r.status,503);
      assert.deepEqual(JSON.parse(r.conteudo),{erro:'AUTH_NOT_CONFIGURED'});
    }
  }
});

test('página é estática, restringe conteúdo e não reflete consultas de terceiros',async()=>{
  const r=await atender('/entrar-social?state=%3Cscript%3Eroubo%3C%2Fscript%3E',{oauthDesktop:true,autenticacao:autenticacaoFicticia});
  assert.equal(r.status,200);
  assert.match(r.headers['Content-Type'],/text\/html/);
  assert.match(r.headers['Content-Security-Policy'],/script-src 'self'/);
  assert.match(r.headers['Content-Security-Policy'],/connect-src 'self'/);
  assert.equal(r.headers['Referrer-Policy'],'no-referrer');
  assert.equal(r.headers['X-Frame-Options'],'DENY');
  assert.match(r.conteudo,/Continuar com GitHub/);
  assert.match(r.conteudo,/Continuar com Google/);
  assert.doesNotMatch(r.conteudo,/roubo|<script>roubo/);
  assert.doesNotMatch(r.conteudo,/GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET/);
});

test('script é local, compilado e não usa CDN nem expõe tokens',async()=>{
  const r=await atender('/entrar-social.js',{oauthDesktop:true,autenticacao:autenticacaoFicticia});
  assert.equal(r.status,200);
  assert.match(r.headers['Content-Type'],/javascript/);
  assert.ok(r.conteudo.length>500,'bundle presente');
  assert.doesNotMatch(r.conteudo,/https?:\/\/cdn\.|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET/);
  const fonte=fs.readFileSync(new URL('../../../../frontend/login/web/entrar-social-fonte.mjs',import.meta.url),'utf8');
  const sha=createHash('sha256').update(fonte).digest('hex');
  assert.ok(r.conteudo.includes('PRUMO_LOGIN_SOCIAL_SHA256='+sha),'bundle corresponde ao fonte editável');
  assert.match(fonte,/ensureElectronRedirect\(/);
  assert.match(fonte,/code_challenge/);
  assert.match(fonte,/state/);
  assert.match(fonte,/fetchOptions:\s*\{query\}/);
  assert.doesNotMatch(fonte,/innerHTML\s*=/);
});

test('método POST não publica a página social',async()=>{
  const r=await atender('/entrar-social',{oauthDesktop:true,autenticacao:autenticacaoFicticia,method:'POST'});
  assert.equal(r.status,404);
});
