/** Identidade global do Prumo: Better Auth e PostgreSQL, somente no processo Node do Render. */
import {betterAuth} from 'better-auth';
import {toNodeHandler} from 'better-auth/node';
import pg from 'pg';
import {enviarPeloResend} from './codigos.mjs';
import {verificarEsquemaDaAutenticacao} from '../regras/verificarEsquema.mjs';
import {provedoresSociais} from '../regras/provedoresSociais.mjs';
import {electron} from '@better-auth/electron';
import {oauthDesktopAtivo, origensOAuthDesktop} from '../regras/oauthDesktop.mjs';

/** Falha fechada: sem servidor HTTPS, banco, segredo forte ou e-mail, não habilita cadastro. */
export function conferirAmbienteDeAutenticacao(env=process.env) {
  const endereco=String(env.BETTER_AUTH_URL||'');
  let url;try{url=new URL(endereco);}catch{throw new Error('AUTH_URL_REQUIRED');}
  if(url.protocol!=='https:' || url.pathname!=='/' || url.search || url.hash || url.username || url.password)
    throw new Error('AUTH_HTTPS_REQUIRED');
  if(!String(env.DATABASE_URL||'').startsWith('postgres'))
    throw new Error('AUTH_DATABASE_REQUIRED');
  if(String(env.BETTER_AUTH_SECRET||'').length<32)
    throw new Error('AUTH_SECRET_REQUIRED');
  if(!env.RESEND_API_KEY||!env.PRUMO_EMAIL_REMETENTE)
    throw new Error('AUTH_EMAIL_REQUIRED');
  return {baseURL:url.origin};
}

export function criarAutenticacao({env=process.env, enviar}={}) {
  const {baseURL}=conferirAmbienteDeAutenticacao(env);
  const pool=new pg.Pool({connectionString:env.DATABASE_URL,max:5,connectionTimeoutMillis:5000,
    idleTimeoutMillis:30000});
  const mandar=enviar??enviarPeloResend({chave:env.RESEND_API_KEY,remetente:env.PRUMO_EMAIL_REMETENTE});
  const mandarTexto=async (para,assunto,texto)=>{
    await mandar({para,assunto,texto,html:`<p style="font-family:sans-serif;white-space:pre-wrap">${texto.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p>`});
  };
  const auth=betterAuth({
    appName:'Prumo QA',
    baseURL,secret:env.BETTER_AUTH_SECRET,
    database:pool,
    socialProviders:provedoresSociais(env),
    // Plugin oficial desativado por padrão até o retorno PKCE ser homologado no Electron.
    plugins:oauthDesktopAtivo(env) ? [electron()] : [],
    trustedOrigins:origensOAuthDesktop(env),
    emailAndPassword:{
      enabled:true,minPasswordLength:10,maxPasswordLength:128,requireEmailVerification:true,revokeSessionsOnPasswordReset:true,
      sendResetPassword:async ({user,token})=>{
        // O token fica no fragmento: não chega ao servidor por GET nem é registrado em logs HTTP.
        const link=baseURL+'/recuperar-senha#token='+encodeURIComponent(token);
        await mandarTexto(user.email,'Recuperar acesso ao Prumo QA',
          'Para definir uma nova senha, abra este link: '+link+'\n\nSe não solicitou, ignore esta mensagem.');
      }
    },
    emailVerification:{
      sendOnSignUp:true,
      sendVerificationEmail:async ({user,url})=>{
        await mandarTexto(user.email,'Confirme seu e-mail no Prumo QA',
          'Confirme seu e-mail para ativar a conta: '+url+'\n\nSe não solicitou, ignore esta mensagem.');
      }
    },
    rateLimit:{enabled:true,storage:'database',window:60,max:100,
      customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3},
        '/request-password-reset':{window:60,max:3}}},
    advanced:{useSecureCookies:true}
  });
  return {auth,atender:toNodeHandler(auth),checar:()=>verificarEsquemaDaAutenticacao(pool),fechar:()=>pool.end()};
}
