/** Identidade global do Prumo: Better Auth e PostgreSQL, somente no processo Node do Render. */
import {betterAuth} from 'better-auth';
import {toNodeHandler} from 'better-auth/node';
import pg from 'pg';
import {enviarPeloResend} from './codigos.mjs';
import {montarEmail} from './modeloDeEmail.mjs';

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
  // Quem cadastra escolhe o nome: só um primeiro nome de letras entra no e-mail, nunca endereço ou link.
  const saudacao=user=>{const nome=String(user.name||'').trim().split(/\s+/)[0];return /^\p{L}[\p{L}'-]{0,39}$/u.test(nome)?'Olá, '+nome+'!':'';};
  const auth=betterAuth({
    appName:'Prumo QA',
    baseURL,secret:env.BETTER_AUTH_SECRET,
    database:pool,
    emailAndPassword:{
      enabled:true,minPasswordLength:10,maxPasswordLength:128,requireEmailVerification:true,revokeSessionsOnPasswordReset:true,
      sendResetPassword:async ({user,token})=>{
        // O token fica no fragmento: não chega ao servidor por GET nem é registrado em logs HTTP.
        const link=baseURL+'/recuperar-senha#token='+encodeURIComponent(token);
        await mandar({para:user.email,assunto:'Recuperar acesso ao Prumo QA',...montarEmail({
          chip:'Recuperar acesso',titulo:'Defina uma senha nova',saudacao:saudacao(user),
          texto:'Recebemos um pedido para trocar a senha da sua conta no Prumo QA.',
          acao:{rotulo:'Definir senha nova',url:link},
          observacao:'O link vale por 1 hora. Se você não pediu, ignore esta mensagem: sua senha continua a mesma.'})});
      }
    },
    emailVerification:{
      sendOnSignUp:true,
      sendVerificationEmail:async ({user,url})=>{
        await mandar({para:user.email,assunto:'Confirme seu e-mail no Prumo QA',...montarEmail({
          chip:'Confirmação de e-mail',titulo:'Confirme seu e-mail',saudacao:saudacao(user),
          texto:'Falta só confirmar este endereço para ativar sua conta no Prumo QA.',
          acao:{rotulo:'Confirmar e-mail',url},
          observacao:'O link vale por 1 hora. Se você não pediu, ignore esta mensagem.'})});
      }
    },
    rateLimit:{enabled:true,storage:'database',window:60,max:100,
      customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3},
        '/request-password-reset':{window:60,max:3}}},
    // No Render, a Cloudflare reescreve CF-Connecting-IP com o IP real; o X-Forwarded-For chega com vários
    // endereços e o Better Auth juntava todo mundo num só contador de tentativas.
    advanced:{useSecureCookies:true,ipAddress:{ipAddressHeaders:['cf-connecting-ip']}}
  });
  return {auth,atender:toNodeHandler(auth),checar:async()=>{await pool.query('SELECT 1');},fechar:()=>pool.end()};
}
