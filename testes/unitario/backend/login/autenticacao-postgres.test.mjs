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
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

test('IPC central bloqueia criação de admin local e rotas antigas mesmo sem conta no computador',()=>{
  const antiga=process.env.PRUMO_AUTH_API_URL;
  process.env.PRUMO_AUTH_API_URL='https://prumo-qa-auth-dev.onrender.com';
  try{
    for(const canal of ['usuarios:ativar','acesso:github','conta:googleiniciar','conta:recuperar','conta:confirmarentrada'])
      assert.throws(()=>conferirAcessoAoCanal(canal),/LOGIN_METHOD_DISABLED/);
    // Trocar senha vai ao Better Auth: o canal passa da lista de bloqueio e só exige sessão.
    assert.throws(()=>conferirAcessoAoCanal('conta:senha'),e=>!/LOGIN_METHOD_DISABLED/.test(e.message));
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
test('cadastro remoto e reenvio da verificacao usam callback seguro e nao iniciam sessao',async t=>{
  const {cadastrarRemotamente,reenviarVerificacaoRemota}=await import('../../../../dist/login/integracoes/autenticacaoRemota.js');
  const antiga=process.env.PRUMO_AUTH_API_URL,buscar=globalThis.fetch,rotas=[];
  process.env.PRUMO_AUTH_API_URL='https://auth.example.com';
  t.after(()=>{
    globalThis.fetch=buscar;
    if(antiga===undefined)delete process.env.PRUMO_AUTH_API_URL;else process.env.PRUMO_AUTH_API_URL=antiga;
  });
  globalThis.fetch=async (url,opcoes)=>{rotas.push({rota:new URL(url).pathname,corpo:JSON.parse(opcoes.body||'{}'),origem:opcoes.headers.Origin});return Response.json({ok:true});};
  assert.deepEqual(await cadastrarRemotamente('Pessoa','PESSOA@example.com','senha1234567'),{estado:'VERIFICACAO_PENDENTE'});
  assert.deepEqual(await reenviarVerificacaoRemota(' PESSOA@example.com '),{enviado:true});
  assert.deepEqual(rotas.map(x=>x.rota),['/api/auth/sign-up/email','/api/auth/send-verification-email']);
  for(const rota of rotas) {
    assert.equal(rota.corpo.email,'pessoa@example.com');
    assert.equal(rota.corpo.callbackURL,'https://auth.example.com/conta-confirmada');
    // Sem Origin, o Better Auth 1.7 recusa o POST vindo do fetch do Node (homologação de 21/10/2026).
    assert.equal(rota.origem,'https://auth.example.com');
  }
  assert.equal(rotas[1].corpo.password,undefined);
  globalThis.fetch=async()=>new Response(JSON.stringify({erro:'AUTH_NOT_CONFIGURED'}),{status:503});
  await assert.rejects(()=>reenviarVerificacaoRemota('pessoa@example.com'),/IDENTITY_NOT_CONFIGURED/);
  globalThis.fetch=async()=>new Response('{}',{status:503});
  await assert.rejects(()=>reenviarVerificacaoRemota('pessoa@example.com'),/IDENTITY_SERVICE_UNAVAILABLE/);
  globalThis.fetch=async()=>new Response('{}',{status:429});
  await assert.rejects(()=>reenviarVerificacaoRemota('pessoa@example.com'),/EMAIL_RATE_LIMIT/);
});
test('envio local informa explicitamente quando o provedor nao esta configurado',async t=>{
  const {enviarCodigoPorEmail}=await import('../../../../dist/login/integracoes/envioEmail.js');
  const antiga=process.env.PRUMO_SERVICO,buscar=globalThis.fetch;
  process.env.PRUMO_SERVICO='https://auth.example.com';
  globalThis.fetch=async()=>new Response('{}',{status:503});
  t.after(()=>{
    globalThis.fetch=buscar;
    if(antiga===undefined)delete process.env.PRUMO_SERVICO;else process.env.PRUMO_SERVICO=antiga;
  });
  await assert.rejects(()=>enviarCodigoPorEmail({
    email:'pessoa@example.com',codigo:'123456',finalidade:'CADASTRO',idioma:'pt-BR'
  }),/EMAIL_SERVICE_NOT_CONFIGURED/);
});

test('homologação abre perfil isolado e nunca aponta para serviço de produção',async()=>{
  const {ambienteDaHomologacao}=await import('../../../../scripts/iniciar-homologacao.mjs');
  const vars=ambienteDaHomologacao({LOCALAPPDATA:'C:/local/teste',PRUMO_AUTH_API_URL:'https://prumo-qa-servico.onrender.com',PRUMO_SERVICO:'https://prumo-qa-servico.onrender.com'});
  assert.equal(vars.PRUMO_AUTH_API_URL,'https://prumo-qa-auth-dev.onrender.com');
  assert.equal(vars.PRUMO_SERVICO,'https://prumo-qa-auth-dev.onrender.com');
  assert.equal(vars.PRUMO_LOGIN_MVP,'1');
  assert.match(vars.PRUMO_DATA_DIR,/PrumoQA-Homologacao-Cadastro$/);
  assert.equal(vars.PRUMO_AMBIENTE,'homologacao');
  assert.match(vars.PRUMO_VERSAO_HOMOLOGACAO,/^\d+\.\d+\.\d+$/);
});

test('homologação mostra a próxima versão a subir, nunca a já publicada',async()=>{
  const {versaoEmHomologacao}=await import('../../../../scripts/iniciar-homologacao.mjs');
  const publicada={versions:[{version:'2.18.0',status:'publicada'},{version:'2.17.1',status:'publicada'}]};
  assert.equal(versaoEmHomologacao(publicada),'2.19.0');
  assert.equal(versaoEmHomologacao({versions:[{version:'2.18.1',status:'repositorio'},...publicada.versions]}),'2.18.1');
  assert.equal(versaoEmHomologacao(publicada,'2.18.1'),'2.18.1');
  assert.equal(versaoEmHomologacao(publicada,'--algo'),'2.19.0');
});
