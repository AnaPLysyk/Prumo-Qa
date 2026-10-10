import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {z} from 'zod';
import type {Servico} from './espacos.js';

export const codigosServico=['CREDENTIAL_UNAVAILABLE','CREDENTIAL_INVALID_OR_EXPIRED','SERVICE_PERMISSION','SERVICE_NOT_FOUND','SERVICE_RATE_LIMIT','SERVICE_TIMEOUT','SERVICE_UNAVAILABLE','SERVICE_RESPONSE_INVALID','SERVICE_REDIRECT_BLOCKED','SERVICE_RESPONSE_LIMIT','SERVICE_DESTINATION_BLOCKED','SERVICE_WRITE_BLOCKED','SERVICE_SCOPE_CHANGED'] as const;
export class ErroServico extends Error{constructor(public codigo:typeof codigosServico[number],public retryAfter?:string){super(codigo);}}
export function instanciaServico(servico:Servico,valor?:string){
  if(servico==='github')return 'https://api.github.com';if(servico==='qase')return 'https://api.qase.io';
  let u:URL;try{u=new URL(valor??'');}catch{throw new ErroServico('SERVICE_DESTINATION_BLOCKED');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash||!/^([a-z0-9][a-z0-9-]{0,62})\.atlassian\.net$/.test(u.hostname))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return u.origin;
}
export function enderecoPublico(ip:string){
  // Conjunto conservador: descarta IPv6 no transporte inicial e todas as faixas especiais IPv4.
  if(isIP(ip)!==4)return false;const a=ip.split('.').map(Number);const[x,y]=a;
  const terceiro=a[2]!;
  return x!>=1&&x!<224&&x!==10&&x!==127&&!(x===169&&y===254)&&!(x===172&&y!>=16&&y!<=31)&&!(x===100&&y!>=64&&y!<=127)&&!(x===192&&(y===168||y===0||y===88))&&!(x===198&&(y===18||y===19||(y===51&&terceiro===100)))&&!(x===203&&y===0&&terceiro===113);
}
export type PedidoServico={servico:Servico;instancia:string;caminho:string;headers:Record<string,string>;timeoutMs?:number};
export type TransporteServico=(pedido:PedidoServico)=>Promise<unknown>;
export const transporteHttps:TransporteServico=async p=>{
  const origem=instanciaServico(p.servico,p.instancia);if(origem!==p.instancia||!p.caminho.startsWith('/')||p.caminho.startsWith('//'))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const u=new URL(p.caminho,origem);if(u.origin!==origem)throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const base=p.servico==='jira'?'/rest/api/3/':p.servico==='qase'?'/v1/':'/';if(!u.pathname.startsWith(base))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  // Resolve UMA vez e fixa o IP no socket TLS. Não segue redirects e nunca envia corpo.
  let ip:string;let dnsTimer:ReturnType<typeof setTimeout>|undefined;try{const r=await Promise.race([lookup(u.hostname,{family:4}),new Promise<never>((_,reject)=>{dnsTimer=setTimeout(()=>reject(new ErroServico('SERVICE_TIMEOUT')),3000);dnsTimer.unref();})]);ip=r.address;}catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}finally{clearTimeout(dnsTimer);}
  if(!enderecoPublico(ip))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return new Promise((resolve,reject)=>{
    let encerrado=false;const fim=(e?:Error,v?:unknown)=>{if(encerrado)return;encerrado=true;clearTimeout(timer);e?reject(e):resolve(v);};
    const req=https.request(u,{method:'GET',agent:false,headers:{Accept:'application/json','User-Agent':'Prumo-QA-desktop',...p.headers},lookup:(_h,_o,cb)=>cb(null,ip,4)},res=>{
      const status=res.statusCode??0;
      if(status!==200){res.resume();const code=status===401?'CREDENTIAL_INVALID_OR_EXPIRED':status===403?(res.headers['x-ratelimit-remaining']==='0'?'SERVICE_RATE_LIMIT':'SERVICE_PERMISSION'):status===404?'SERVICE_NOT_FOUND':status===429?'SERVICE_RATE_LIMIT':status>=300&&status<400?'SERVICE_REDIRECT_BLOCKED':status>=500?'SERVICE_UNAVAILABLE':'SERVICE_RESPONSE_INVALID';fim(new ErroServico(code));return;}
      if(!/\bapplication\/(?:[a-z.+-]*\+)?json\b/i.test(String(res.headers['content-type']??''))){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_INVALID'));return;}
      let size=0;const chunks:Buffer[]=[];res.on('data',b=>{size+=b.length;if(size>2*1024*1024){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_LIMIT'));}else chunks.push(b);});
      res.on('end',()=>{try{fim(undefined,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{fim(new ErroServico('SERVICE_RESPONSE_INVALID'));}});res.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));
    });
    const timer=setTimeout(()=>{req.destroy();fim(new ErroServico('SERVICE_TIMEOUT'));},p.timeoutMs??10000);
    req.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));req.end();
  });
};
export const paginaSchema=z.object({offset:z.number().int().min(0).max(100000).default(0),cursor:z.string().max(2000).optional(),limite:z.number().int().min(1).max(100).default(50)}).strict();
