/** Faz a chamada HTTPS ao serviço: IP público fixado, sem redirecionamento, com tempo e tamanho limitados. */
import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { rotaEscritaPermitida } from '../escrita/rotaEscritaPermitida.js';
import { enderecoPublico } from './enderecoPublico.js';
import { ErroServico } from './ErroServico.js';
import { instanciaServico } from './instanciaServico.js';
import { MetodoEscrita } from '../tipos/rotasDeEscrita.js';
import { PedidoServico } from '../tipos/transporte.js';

export async function requisitarServico(p:PedidoServico,metodo:'GET'|MetodoEscrita,corpo?:string|Buffer,tipoConteudo='application/json'):Promise<unknown>{
  const origem=instanciaServico(p.servico,p.instancia);if(origem!==p.instancia||!p.caminho.startsWith('/')||p.caminho.startsWith('//'))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const u=new URL(p.caminho,origem);if(u.origin!==origem)throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const base=p.servico==='jira'?'/rest/api/3/':p.servico==='qase'?'/v1/':'/';if(!u.pathname.startsWith(base))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  if(metodo!=='GET'&&(u.search||!rotaEscritaPermitida(p.servico,metodo,u.pathname)))throw new ErroServico('SERVICE_WRITE_BLOCKED');
  // Resolve UMA vez e fixa o IP no socket TLS. Não segue redirects. Corpo só existe no POST de comentário (2.8).
  let ip:string;let dnsTimer:ReturnType<typeof setTimeout>|undefined;try{const r=await Promise.race([lookup(u.hostname,{family:4}),new Promise<never>((_,reject)=>{dnsTimer=setTimeout(()=>reject(new ErroServico('SERVICE_TIMEOUT')),3000);dnsTimer.unref();})]);ip=r.address;}catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}finally{clearTimeout(dnsTimer);}
  if(!enderecoPublico(ip))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return new Promise((resolve,reject)=>{
    let encerrado=false;const fim=(e?:Error,v?:unknown)=>{if(encerrado)return;encerrado=true;clearTimeout(timer);e?reject(e):resolve(v);};
    const req=https.request(u,{method:metodo,agent:false,headers:{Accept:'application/json','User-Agent':'Prumo-QA-desktop',...(corpo!==undefined?{'Content-Type':tipoConteudo,'Content-Length':String(Buffer.byteLength(corpo))}:{}),...p.headers},lookup:(_h,_o,cb)=>cb(null,ip,4)},res=>{
      const status=res.statusCode??0;
      if(!(metodo==='GET'?status===200:status===200||status===201||status===204)){res.resume();const code=status===401?'CREDENTIAL_INVALID_OR_EXPIRED':status===403?(res.headers['x-ratelimit-remaining']==='0'?'SERVICE_RATE_LIMIT':'SERVICE_PERMISSION'):status===404?'SERVICE_NOT_FOUND':status===429?'SERVICE_RATE_LIMIT':status>=300&&status<400?'SERVICE_REDIRECT_BLOCKED':status>=500?'SERVICE_UNAVAILABLE':'SERVICE_RESPONSE_INVALID';fim(new ErroServico(code));return;}
      if(status===204){res.resume();fim(undefined,{});return;}
      if(!/\bapplication\/(?:[a-z.+-]*\+)?json\b/i.test(String(res.headers['content-type']??''))){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_INVALID'));return;}
      let size=0;const chunks:Buffer[]=[];res.on('data',b=>{size+=b.length;if(size>2*1024*1024){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_LIMIT'));}else chunks.push(b);});
      res.on('end',()=>{try{fim(undefined,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{fim(new ErroServico('SERVICE_RESPONSE_INVALID'));}});res.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));
    });
    const timer=setTimeout(()=>{req.destroy();fim(new ErroServico('SERVICE_TIMEOUT'));},p.timeoutMs??10000);
    req.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));req.end(corpo);
  });
}
