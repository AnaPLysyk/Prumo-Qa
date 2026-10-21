/** Autoriza acesso a repositórios GitHub via OAuth com PKCE, sem expor tokens ao frontend. */
// O retorno local utiliza state e mantém os tokens no backend.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { shell, safeStorage } from 'electron';
import { trocarCodigoNoGithub, lerPerfilDoGithub } from '../../login/integracoes/oauthDosProvedores.js';
import { configuracaoDoProvedor } from '../../login/regras/configuracaoDoLogin.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { servicosDoAplicativo } from '../regras/nucleoServicos.js';
import { autenticarGitHubWindows, listarGitHubWindows, tokenGitHubWindows } from './credencialGitHubWindows.js';

type Estado = { estado:'INATIVO'|'AGUARDANDO'|'ESCOLHER_CONTA'|'CONECTADO'|'CANCELADO'|'EXPIRADO'|'NEGADO'|'ERRO'; mensagem?:string; contas?:string[]; conta?:{id:string;nome:string;identidade:string} };
type Tentativa = { dono:string; servidor:http.Server; timer:NodeJS.Timeout; url:string; concluindo:boolean };
let tentativa:Tentativa|null=null;
let resultado:{dono:string;valor:Estado}|null=null;
let tentativaWindows:{dono:string;cancelamento:AbortController}|null=null;
const codigoSeguro = (a:string,b:string) => {
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length && timingSafeEqual(x,y);
};
const donoAtual=()=>{const id=contaDaSessao()?.id;if(!id)throw new Error('SESSION_REQUIRED');return id;};
const pagina=(titulo:string,corpo:string)=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Prumo QA</title><body style="font:16px system-ui;margin:12vh auto;max-width:28rem;text-align:center"><h1>${titulo}</h1><p>${corpo}</p></body></html>`;
function encerrar(){
  if(!tentativa)return;
  const { servidor,timer }=tentativa;tentativa=null;clearTimeout(timer);
  servidor.close();servidor.closeIdleConnections?.();
  setTimeout(()=>servidor.closeAllConnections?.(),2000).unref();
}
function estadoFinal(dono:string,valor:Estado){
  resultado={dono,valor};encerrar();
}
const publica=(dono:string):Estado=>tentativaWindows?.dono===dono?{estado:'AGUARDANDO'}:resultado?.dono===dono?resultado.valor:tentativa?.dono===dono?{estado:'AGUARDANDO'}:{estado:'INATIVO'};

/** Preferência para Git for Windows: usa a autenticação oficial do Git Credential Manager sem OAuth App próprio. */
async function conectarViaWindows(dono:string, usuario?:string):Promise<Estado|null>{
  const contas=await listarGitHubWindows();
  if(contas===null)return null;
  if(tentativaWindows?.dono===dono)return {estado:'AGUARDANDO'};
  if(usuario&&!contas.includes(usuario))throw new Error('GITHUB_ACCOUNT_INVALID');
  // Confirmação explícita mesmo para uma única conta: Prumo possui contas de usuário independentes no mesmo Windows.
  if(!usuario&&contas.length>0)return {estado:'ESCOLHER_CONTA',contas};
  resultado=null;encerrar();
  const cancelamento=new AbortController();
  tentativaWindows={dono,cancelamento};
  void(async()=>{
    try{
      let escolhido=usuario||contas[0];
      if(!escolhido){
        await autenticarGitHubWindows(cancelamento.signal);
        const novas=await listarGitHubWindows();
        if(!novas?.length)throw new Error('GITHUB_WINDOWS_AUTH_FAILED');
        if(novas.length>1){
          if(tentativaWindows?.cancelamento===cancelamento){tentativaWindows=null;resultado={dono,valor:{estado:'ESCOLHER_CONTA',contas:novas}};}
          return;
        }
        escolhido=novas[0]!;
      }
      const token=await tokenGitHubWindows(escolhido!,cancelamento.signal);
      const perfil=await lerPerfilDoGithub(token);
      if(perfil.login.toLowerCase()!==escolhido!.toLowerCase())throw new Error('GITHUB_ACCOUNT_MISMATCH');
      if(tentativaWindows?.cancelamento!==cancelamento||donoAtual()!==dono)return;
      const conta=await servicosDoAplicativo.adicionar({servico:'github',nome:'GitHub · '+perfil.login,token});
      if(tentativaWindows?.cancelamento!==cancelamento||donoAtual()!==dono)return;
      tentativaWindows=null;resultado={dono,valor:{estado:'CONECTADO',conta:{id:conta.id,nome:conta.nome,identidade:conta.identidade}}};
    }catch(e){
      if(tentativaWindows?.cancelamento!==cancelamento)return;
      tentativaWindows=null;resultado={dono,valor:{estado:'ERRO',mensagem:(e as Error).message==='CONNECTION_DUPLICATE'?'Esta conta GitHub já está conectada.':'Não foi possível usar a conta GitHub do Windows. Faça login novamente no Git Credential Manager ou utilize a opção avançada.'}};
    }
  })();
  return {estado:'AGUARDANDO'};
}

/** Clique único: abre o GitHub. O navegador volta ao Prumo sem código manual. */
export async function iniciarConexaoGithub(usuario?:string):Promise<Estado> {
  const dono=donoAtual();
  if(!safeStorage.isEncryptionAvailable())throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
  const windows=await conectarViaWindows(dono,usuario);
  if(windows)return windows;
  const configuracao=configuracaoDoProvedor('github');
  if(!configuracao)throw new Error('GITHUB_CONNECTION_NOT_CONFIGURED: configure o OAuth App do GitHub na Administração.');
  if(tentativa?.dono===dono){await shell.openExternal(tentativa.url);return publica(dono);}
  encerrar();resultado=null;
  const state=randomBytes(24).toString('base64url'),verificador=randomBytes(48).toString('base64url');
  const desafio=createHash('sha256').update(verificador).digest('base64url');
  const servidor=http.createServer((req,res)=>{
    const porta=(servidor.address() as AddressInfo).port;
    const responder=(status:number,titulo:string,mensagem:string)=>{
      res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
        'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'X-Content-Type-Options':'nosniff'});
      res.end(pagina(titulo,mensagem));
    };
    if(req.method!=='GET'||req.headers.host!==`127.0.0.1:${porta}`)return responder(400,'Pedido recusado','A autorização só pode voltar ao Prumo neste computador.');
    const url=new URL(req.url??'/',`http://127.0.0.1:${porta}`);
    if(url.pathname!=='/callback')return responder(404,'Não encontrado','Endereço não reconhecido.');
    if(!tentativa||tentativa.servidor!==servidor||tentativa.concluindo)return responder(409,'Autorização encerrada','Volte ao Prumo.');
    if(!codigoSeguro(url.searchParams.get('state')??'',state))return responder(400,'Pedido recusado','Código de segurança inválido.');
    const code=url.searchParams.get('code')??'';
    if(url.searchParams.has('error')||!code||code.length>2000){
      estadoFinal(dono,{estado:'NEGADO'});
      return responder(200,'Autorização cancelada','Volte ao Prumo para tentar novamente.');
    }
    tentativa.concluindo=true;
    void (async()=>{
      try{
        if(donoAtual()!==dono)throw new Error('SESSION_CHANGED');
        const token=await trocarCodigoNoGithub({clientId:configuracao.clientId,clientSecret:configuracao.clientSecret,code,
          redirectUri:`http://127.0.0.1:${porta}/callback`,codeVerifier:verificador});
        const perfil=await lerPerfilDoGithub(token);
        if(donoAtual()!==dono)throw new Error('SESSION_CHANGED');
        const conta=await servicosDoAplicativo.adicionar({servico:'github',nome:'GitHub · '+perfil.login,token});
        estadoFinal(dono,{estado:'CONECTADO',conta:{id:conta.id,nome:conta.nome,identidade:conta.identidade}});
        responder(200,'GitHub conectado','Tudo certo. Volte ao Prumo QA para escolher o repositório.');
      }catch(e){
        estadoFinal(dono,{estado:'ERRO',mensagem:(e as Error).message.startsWith('CONNECTION_DUPLICATE')?'Esta conta GitHub já está conectada.': 'A conexão não foi concluída. Confira as permissões e tente novamente.'});
        responder(200,'Não foi possível conectar','Volte ao Prumo QA para conferir o resultado.');
      }
    })();
  });
  await new Promise<void>((ok,falha)=>{servidor.once('error',falha);servidor.listen(0,'127.0.0.1',ok);});
  const porta=(servidor.address() as AddressInfo).port,redirectUri=`http://127.0.0.1:${porta}/callback`;
  const url='https://github.com/login/oauth/authorize?'+new URLSearchParams({
    client_id:configuracao.clientId,redirect_uri:redirectUri,scope:'repo read:user',
    state,code_challenge:desafio,code_challenge_method:'S256'
  }).toString();
  const timer=setTimeout(()=>estadoFinal(dono,{estado:'EXPIRADO'}),300000);timer.unref();
  tentativa={dono,servidor,timer,url,concluindo:false};
  try{await shell.openExternal(url);}
  catch{estadoFinal(dono,{estado:'ERRO',mensagem:'Não foi possível abrir o navegador.'});}
  return publica(dono);
}

/** Consultado pelo renderer: nenhum token nem Client Secret retorna à página. */
export function estadoConexaoGithub(cancelar=false):Estado {
  const dono=donoAtual();
  if(cancelar&&tentativaWindows?.dono===dono){tentativaWindows.cancelamento.abort();tentativaWindows=null;resultado={dono,valor:{estado:'CANCELADO'}};}
  if(cancelar && tentativa?.dono===dono){estadoFinal(dono,{estado:'CANCELADO'});}
  return publica(dono);
}
