/** Cliente HTTPS do Better Auth: cookie secreto fica somente no Electron Main, nunca no renderer. */
import {encerrarSessao} from '../regras/sessao.js';

let cookieSessao:string|null=null;
let proximaConferencia=0;
let loginEmAndamento=false;
import { enderecoDeAutenticacao, usarAutenticacaoRemota } from './envioEmail.js';
export { enderecoDeAutenticacao, usarAutenticacaoRemota } from './envioEmail.js';
function obrigatorio(){const u=enderecoDeAutenticacao();if(!u)throw new Error('IDENTITY_NOT_CONFIGURED');return u;}
type Acao='login'|'cadastro'|'verificacao'|'recuperacao'|'senha'|'integracao';
function exporErro(status:number,acao:Acao='login'){
  if(acao==='integracao'){
    if(status===401)throw new Error('SESSION_EXPIRED');
    if(status===429)throw new Error('INTEGRATION_RATE_LIMIT');
    if(status===400||status===403||status===404||status===409)throw new Error('INTEGRATION_INVALID');
    throw new Error('IDENTITY_SERVICE_UNAVAILABLE');
  }
  if(status===429)throw new Error(acao==='login'||acao==='senha'?'LOGIN_RATE_LIMIT':'EMAIL_RATE_LIMIT');
  if(acao==='senha'&&status===401)throw new Error('SESSION_EXPIRED');
  // Better Auth responde 400 quando a senha atual não confere.
  if(acao==='senha'&&(status===400||status===403))throw new Error('PASSWORD_INVALID');
  if(status===401||status===400||status===403)
    throw new Error(acao==='cadastro'?'SIGNUP_INVALID':acao==='login'?'LOGIN_INVALID':'EMAIL_INVALID');
  throw new Error('IDENTITY_SERVICE_UNAVAILABLE');
}
async function chamar(path:string,body?:unknown,comSessao=false,acao:Acao='login'){
  const origem=obrigatorio();
  const headers:Record<string,string>={'Accept':'application/json'};
  // O fetch do Node manda Sec-Fetch-Mode; com ele o Better Auth exige Origin confiável em todo POST (403 MISSING_OR_NULL_ORIGIN).
  if(body!==undefined){headers['Content-Type']='application/json';headers.Origin=origem;}
  if(comSessao&&cookieSessao)headers.Cookie=cookieSessao;
  let resposta:Response;
  try{resposta=await fetch(origem+path,{
    method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),
    redirect:'error',signal:AbortSignal.timeout(75000),cache:'no-store'
  });}catch{throw new Error('IDENTITY_SERVICE_UNAVAILABLE');}
  if(!resposta.ok){
    if(resposta.status===503){
      let naoConfigurado=false;
      let semIntegracao=false;
      try{const erro=(await resposta.clone().json())?.erro;naoConfigurado=erro==='AUTH_NOT_CONFIGURED';semIntegracao=erro==='INTEGRATION_NOT_CONFIGURED';}
      catch{/* resposta 503 sem JSON é apenas serviço indisponível */}
      if(naoConfigurado)throw new Error('IDENTITY_NOT_CONFIGURED');
      if(semIntegracao)throw new Error('INTEGRATION_NOT_CONFIGURED');
    }
    exporErro(resposta.status,acao);
  }
  // Cookie HttpOnly/Secure do Better Auth. Não permitir cookies arbitrários nem material no renderer.
  for(const cabecalho of resposta.headers.getSetCookie?.()||[]){
    const par=cabecalho.split(';',1)[0]||'';
    if(/^(?:__Secure-)?better-auth\.session_token=[A-Za-z0-9%._~-]+$/.test(par))
      cookieSessao=par;
  }
  try{return await resposta.json();}catch{throw new Error('IDENTITY_SERVICE_UNAVAILABLE');}
}
export type UsuarioRemoto={id:string;email:string;name:string;emailVerified:boolean;administrador:boolean};
function confirmarUsuario(valor:any):UsuarioRemoto{
  const u=valor?.user;
  if(!u||typeof u.id!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(u.id)||
     typeof u.email!=='string'||u.emailVerified!==true)
    throw new Error('IDENTITY_INVALID');
  if(!valor.session?.expiresAt||Date.parse(valor.session.expiresAt)<=Date.now())
    throw new Error('SESSION_EXPIRED');
  return {id:u.id,email:u.email.toLowerCase(),name:String(u.name||'Pessoa Prumo'),emailVerified:true,administrador:valor.administrador===true};
}
export async function entrarRemotamente(email:string,senha:string){
  if(loginEmAndamento)throw new Error('LOGIN_IN_PROGRESS');
  if(typeof senha!=='string'||senha.length<10)throw new Error('LOGIN_INVALID');
  // Um único login por processo evita cruzar o cookie de duas identidades
  // enquanto os pedidos HTTP assíncronos ainda estão em andamento.
  loginEmAndamento=true;
  try {
    cookieSessao=null;proximaConferencia=0;encerrarSessao();
    try {
      await chamar('/api/auth/sign-in/email',{email:email.trim().toLowerCase(),password:senha,rememberMe:false});
      if(!cookieSessao)throw new Error('IDENTITY_INVALID');
      return confirmarUsuario(await chamar('/api/auth/get-session',undefined,true));
    } catch(erro) {
      // Uma conta não confirmada ou falha de rede não pode reter sessão.
      await sairRemotamente();
      throw erro;
    }
  } finally {
    loginEmAndamento=false;
  }
}
export async function cadastrarRemotamente(nome:string,email:string,senha:string){
  if(senha.length<10)throw new Error('PASSWORD_WEAK');
  await chamar('/api/auth/sign-up/email',{name:nome.trim(),email:email.trim().toLowerCase(),password:senha,callbackURL:obrigatorio()+'/conta-confirmada'},false,'cadastro');
  return {estado:'VERIFICACAO_PENDENTE' as const};
}
/** Reenvia um link de verificação sem expor tokens ou cookies na janela. */
export async function reenviarVerificacaoRemota(email:string){
  await chamar('/api/auth/send-verification-email',{
    email:email.trim().toLowerCase(),callbackURL:obrigatorio()+'/conta-confirmada'
  },false,'verificacao');
  return {enviado:true};
}
/** Troca a senha na conta central: as outras sessões caem e esta recebe um cookie novo. */
export async function trocarSenhaRemota(atual:string,nova:string){
  if(!cookieSessao)throw new Error('SESSION_REQUIRED');
  if(nova.length<10)throw new Error('PASSWORD_WEAK');
  await chamar('/api/auth/change-password',{currentPassword:atual,newPassword:nova,revokeOtherSessions:true},true,'senha');
  proximaConferencia=0;
  return {trocada:true};
}
export async function pedirRecuperacaoRemota(email:string){
  await chamar('/api/auth/request-password-reset',{email:email.trim().toLowerCase()},false,'recuperacao');
  return {enviado:true};
}
export async function validarSessaoRemota(){
  if(!usarAutenticacaoRemota())return;
  if(!cookieSessao)throw new Error('SESSION_REQUIRED');
  if(Date.now()<proximaConferencia)return;
  try{confirmarUsuario(await chamar('/api/auth/get-session',undefined,true));}
  catch{cookieSessao=null;proximaConferencia=0;encerrarSessao();throw new Error('SESSION_EXPIRED');}
  proximaConferencia=Date.now()+20000;
}
/** Pedido autenticado às rotas /v1/integracoes do serviço do Prumo: usa o cookie da sessão, que nunca sai do processo principal. */
export async function chamarServicoDoPrumo(caminho:string,corpo?:unknown){
  if(!usarAutenticacaoRemota())throw new Error('INTEGRATION_NOT_CONFIGURED');
  if(!cookieSessao)throw new Error('SESSION_REQUIRED');
  return chamar(caminho,corpo,true,'integracao');
}
export async function sairRemotamente(){
  try{if(cookieSessao&&usarAutenticacaoRemota())await chamar('/api/auth/sign-out',{},true);}
  catch{/* Encerrar sempre o acesso local, mesmo sem resposta de rede. */}
  finally{cookieSessao=null;proximaConferencia=0;}
}
