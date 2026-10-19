/** Cliente HTTPS do Better Auth: cookie secreto fica somente no Electron Main, nunca no renderer. */
import {encerrarSessao} from '../regras/sessao.js';

let cookieSessao:string|null=null;
let proximaConferencia=0;
import { enderecoDeAutenticacao, usarAutenticacaoRemota } from './configuracaoDaAutenticacao.js';
export { enderecoDeAutenticacao, usarAutenticacaoRemota } from './configuracaoDaAutenticacao.js';
function obrigatorio(){const u=enderecoDeAutenticacao();if(!u)throw new Error('IDENTITY_NOT_CONFIGURED');return u;}
function exporErro(status:number){
  if(status===429)throw new Error('LOGIN_RATE_LIMIT');
  if(status===401||status===400||status===403)throw new Error('LOGIN_INVALID');
  throw new Error('IDENTITY_SERVICE_UNAVAILABLE');
}
async function chamar(path:string,body?:unknown,comSessao=false){
  const origem=obrigatorio();
  const headers:Record<string,string>={'Accept':'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(comSessao&&cookieSessao)headers.Cookie=cookieSessao;
  let resposta:Response;
  try{resposta=await fetch(origem+path,{
    method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),
    redirect:'error',signal:AbortSignal.timeout(75000),cache:'no-store'
  });}catch{throw new Error('IDENTITY_SERVICE_UNAVAILABLE');}
  if(!resposta.ok)exporErro(resposta.status);
  // Cookie HttpOnly/Secure do Better Auth. Não permitir cookies arbitrários nem material no renderer.
  for(const cabecalho of resposta.headers.getSetCookie?.()||[]){
    const par=cabecalho.split(';',1)[0]||'';
    if(/^(?:__Secure-)?better-auth\.session_token=[A-Za-z0-9%._~-]+$/.test(par))
      cookieSessao=par;
  }
  try{return await resposta.json();}catch{throw new Error('IDENTITY_SERVICE_UNAVAILABLE');}
}
export type UsuarioRemoto={id:string;email:string;name:string;emailVerified:boolean};
function confirmarUsuario(valor:any):UsuarioRemoto{
  const u=valor?.user;
  if(!u||typeof u.id!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(u.id)||
     typeof u.email!=='string'||u.emailVerified!==true)
    throw new Error('IDENTITY_INVALID');
  if(!valor.session?.expiresAt||Date.parse(valor.session.expiresAt)<=Date.now())
    throw new Error('SESSION_EXPIRED');
  return {id:u.id,email:u.email.toLowerCase(),name:String(u.name||'Pessoa Prumo'),emailVerified:true};
}
export async function entrarRemotamente(email:string,senha:string){
  if(typeof senha!=='string'||senha.length<10)throw new Error('LOGIN_INVALID');
  cookieSessao=null;proximaConferencia=0;encerrarSessao();
  try {
    await chamar('/api/auth/sign-in/email',{email:email.trim().toLowerCase(),password:senha,rememberMe:false});
    if(!cookieSessao)throw new Error('IDENTITY_INVALID');
    return confirmarUsuario(await chamar('/api/auth/get-session',undefined,true));
  } catch(erro) {
    // O servidor pode emitir cookie antes de confirmar e-mail ou expiração.
    // Se a segunda verificação falhar, revogar também a sessão remota.
    await sairRemotamente();
    throw erro;
  }
}
export async function cadastrarRemotamente(nome:string,email:string,senha:string){
  if(senha.length<10)throw new Error('PASSWORD_WEAK');
  await chamar('/api/auth/sign-up/email',{name:nome.trim(),email:email.trim().toLowerCase(),password:senha,callbackURL:obrigatorio()+'/conta-confirmada'});
  return {estado:'VERIFICACAO_PENDENTE' as const};
}
export async function pedirRecuperacaoRemota(email:string){
  await chamar('/api/auth/request-password-reset',{email:email.trim().toLowerCase()});
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
export async function sairRemotamente(){
  try{if(cookieSessao&&usarAutenticacaoRemota())await chamar('/api/auth/sign-out',{},true);}
  catch{/* Encerrar sempre o acesso local, mesmo sem resposta de rede. */}
  finally{cookieSessao=null;proximaConferencia=0;}
}
