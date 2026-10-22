/** Requisições remotas seguras — arquivos relacionados agrupados para manutenção. */
import { lookup } from "node:dns/promises";
import https from "node:https";
import { LookupFunction, isIP } from "node:net";
import { rotaEscritaPermitida } from "../escrita/permissoes.js";
import { ErroServico } from "./configuracaoDosServicos.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { instanciaServico, cabecalhosDoServico } from "./configuracaoDosServicos.js";
import { MetodoEscrita } from "../tipos/escritaGithub.js";
import { PedidoServico, TransporteEscrita, TransporteServico } from "../tipos/adaptador.js";
import { PartesDoAdaptador, itemQase } from "../tipos/adaptador.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { recursoDaResposta } from "./configuracaoDosServicos.js";

// ── requisitarServico ──
/**
 * lookup que devolve sempre o IP já conferido. O Node atual (autoSelectFamily) chama com {all:true} e espera uma lista;
 * devolver um endereço só nesse caso dava "Invalid IP address: undefined" e derrubava toda conexão real com Qase, Jira e GitHub.
 */
/** Bloqueia localhost, redes internas e IPs especiais antes de estabelecer HTTPS. */
export function enderecoPublico(ip:string){
  // Conjunto conservador: descarta IPv6 no transporte inicial e todas as faixas especiais IPv4.
  if(isIP(ip)!==4)return false;const a=ip.split('.').map(Number);const[x,y]=a;
  const terceiro=a[2]!;
  return x!>=1&&x!<224&&x!==10&&x!==127&&!(x===169&&y===254)&&!(x===172&&y!>=16&&y!<=31)&&!(x===100&&y!>=64&&y!<=127)&&!(x===192&&(y===168||y===0||y===88))&&!(x===198&&(y===18||y===19||(y===51&&terceiro===100)))&&!(x===203&&y===0&&terceiro===113);
}

export const fixarIp=(ip:string):LookupFunction=>(_h,o,cb)=>(o as {all?:boolean})?.all?(cb as unknown as (e:null,l:{address:string;family:number}[])=>void)(null,[{address:ip,family:4}]):cb(null,ip,4);

/** Motivo da recusa em JSON do Qase (errorMessage, errorFields), do Jira (errorMessages, errors) ou do GitHub (message, errors). */
export function motivoDaRecusa(texto:string,segredos:string[]=[]):string|undefined{
  let j:unknown;try{j=JSON.parse(texto);}catch{return undefined;}if(!j||typeof j!=='object')return undefined;const o=j as Record<string,unknown>;
  const partes:string[]=[];const add=(v:unknown)=>{if(typeof v==='string'&&v.trim())partes.push(v.trim());};
  add(o.errorMessage);add(o.message);if(Array.isArray(o.errorMessages))o.errorMessages.forEach(add);
  if(Array.isArray(o.errorFields))for(const f of o.errorFields as Record<string,unknown>[])add([f?.field,f?.error].filter(x=>typeof x==='string').join(': '));
  if(o.errors&&typeof o.errors==='object'&&!Array.isArray(o.errors))for(const [k,v] of Object.entries(o.errors))add(k+': '+String(v));
  if(Array.isArray(o.errors))for(const e of o.errors as Record<string,unknown>[])add([e?.field,e?.code,e?.message].filter(x=>typeof x==='string').join(' '));
  const m=mascarar(partes.join(' · '),segredos).replace(/\s+/g,' ').trim();return m?m.slice(0,200):undefined;
}

/** Id de site Atlassian (UUID) aceito em conexões OAuth do Jira. */
const NUVEM=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Endereço final do pedido, já conferido: só os destinos fixos de cada serviço, o caminho sempre dentro da API e escrita só em rotas da lista fechada. */
export function destinoDoPedido(p:PedidoServico,metodo:'GET'|MetodoEscrita):URL{
  const origem=instanciaServico(p.servico,p.instancia);if(origem!==p.instancia||!p.caminho.startsWith('/')||p.caminho.startsWith('//'))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  // Conexão OAuth do Jira: o destino é sempre api.atlassian.com/ex/jira/<id do site>; o caminho segue as mesmas regras do endereço do site.
  if(p.nuvem!==undefined&&(p.servico!=='jira'||!NUVEM.test(p.nuvem)))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const destino=p.nuvem?'https://api.atlassian.com':origem;const prefixo=p.nuvem?'/ex/jira/'+p.nuvem:'';
  const u=new URL(prefixo+p.caminho,destino);if(u.origin!==destino)throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  const base=prefixo+(p.servico==='jira'?'/rest/api/3/':p.servico==='qase'?'/v1/':'/');if(!u.pathname.startsWith(base))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  if(metodo!=='GET'&&(u.search||!rotaEscritaPermitida(p.servico,metodo,u.pathname.slice(prefixo.length))))throw new ErroServico('SERVICE_WRITE_BLOCKED');
  return u;
}

export async function requisitarServico(p:PedidoServico,metodo:'GET'|MetodoEscrita,corpo?:string|Buffer,tipoConteudo='application/json'):Promise<unknown>{
  const u=destinoDoPedido(p,metodo);
  // Resolve uma vez e fixa o IP no socket TLS. Não segue redirects. Só as escritas (POST, PUT, PATCH) levam corpo.
  let ip:string;let dnsTimer:ReturnType<typeof setTimeout>|undefined;try{const r=await Promise.race([lookup(u.hostname,{family:4}),new Promise<never>((_,reject)=>{dnsTimer=setTimeout(()=>reject(new ErroServico('SERVICE_TIMEOUT')),3000);dnsTimer.unref();})]);ip=r.address;}catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}finally{clearTimeout(dnsTimer);}
  if(!enderecoPublico(ip))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return new Promise((resolve,reject)=>{
    let encerrado=false;const fim=(e?:Error,v?:unknown)=>{if(encerrado)return;encerrado=true;clearTimeout(timer);e?reject(e):resolve(v);};
    const req=https.request(u,{method:metodo,agent:false,headers:{Accept:'application/json','User-Agent':'Prumo-QA-desktop',...(corpo!==undefined?{'Content-Type':tipoConteudo,'Content-Length':String(Buffer.byteLength(corpo))}:{}),...p.headers},lookup:fixarIp(ip)},res=>{
      const status=res.statusCode??0;
      if(!(metodo==='GET'?status===200:status===200||status===201||status===204)){
        // 400/422: o serviço explica o que recusou; o Prumo guarda o motivo (curto e mascarado) em vez de só "resposta inválida".
        // 402: recurso fora do plano contratado (ex.: Qase sem external_issues no plano gratuito); o motivo também é guardado.
        if((status===400||status===402||status===422)&&/json/i.test(String(res.headers['content-type']??''))){let t='';res.setEncoding('utf8');res.on('data',b=>{if(t.length<8192)t+=b;});res.on('end',()=>fim(new ErroServico(status===402?'SERVICE_PLAN_LIMIT':'SERVICE_RESPONSE_INVALID',undefined,motivoDaRecusa(t,Object.values(p.headers??{}).map(String)))));res.on('error',()=>fim(new ErroServico('SERVICE_RESPONSE_INVALID')));return;}
        // 403 sem limite esgotado: o GitHub diz no cabeçalho qual permissão do token faltou (ex.: issues=write); o Prumo repassa isso.
        if(status===403&&res.headers['x-ratelimit-remaining']!=='0'){const aceitas=String(res.headers['x-accepted-github-permissions']??'').trim();let t='';res.setEncoding('utf8');res.on('data',b=>{if(t.length<8192)t+=b;});res.on('end',()=>fim(new ErroServico('SERVICE_PERMISSION',undefined,[aceitas?'permissão necessária: '+aceitas:'',motivoDaRecusa(t,Object.values(p.headers??{}).map(String))??''].filter(Boolean).join(' · ').slice(0,200)||undefined)));res.on('error',()=>fim(new ErroServico('SERVICE_PERMISSION')));return;}
        res.resume();const code=status===401?'CREDENTIAL_INVALID_OR_EXPIRED':status===403?(res.headers['x-ratelimit-remaining']==='0'?'SERVICE_RATE_LIMIT':'SERVICE_PERMISSION'):status===402?'SERVICE_PLAN_LIMIT':status===404?'SERVICE_NOT_FOUND':status===429?'SERVICE_RATE_LIMIT':status>=300&&status<400?'SERVICE_REDIRECT_BLOCKED':status>=500?'SERVICE_UNAVAILABLE':'SERVICE_RESPONSE_INVALID';fim(new ErroServico(code));return;}
      if(status===204){res.resume();fim(undefined,{});return;}
      if(!/\bapplication\/(?:[a-z.+-]*\+)?json\b/i.test(String(res.headers['content-type']??''))){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_INVALID'));return;}
      let size=0;const chunks:Buffer[]=[];res.on('data',b=>{size+=b.length;if(size>2*1024*1024){res.destroy();fim(new ErroServico('SERVICE_RESPONSE_LIMIT'));}else chunks.push(b);});
      res.on('end',()=>{try{fim(undefined,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{fim(new ErroServico('SERVICE_RESPONSE_INVALID'));}});res.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));
    });
    const timer=setTimeout(()=>{req.destroy();fim(new ErroServico('SERVICE_TIMEOUT'));},p.timeoutMs??10000);
    req.on('error',()=>fim(new ErroServico('SERVICE_UNAVAILABLE')));req.end(corpo);
  });
}

// ── requisicoes ──
/** Limita a 12 MB o envio e delega as rotas permitidas ao transporte do serviço. */
export const enviarAoServico: TransporteEscrita = pedido => {
  if (pedido.corpo.length > 12 * 1024 * 1024) {
    throw new ErroServico('SERVICE_WRITE_BLOCKED');
  }
  return requisitarServico(
    { ...pedido, timeoutMs: pedido.timeoutMs ?? 30000 },
    pedido.metodo ?? 'POST',
    pedido.corpo,
    pedido.tipoConteudo ?? 'application/json'
  );
};

/** Toda leitura HTTP usa GET, independentemente do serviço. */
export const lerDoServico: TransporteServico = pedido =>
  requisitarServico(pedido, 'GET');

/** A ausência de credencial nunca vira consulta anônima. */
export async function lerComCredencial(adaptador: PartesDoAdaptador, caminho: string): Promise<unknown> {
  if (!adaptador.c.token) throw new ErroServico('CREDENTIAL_UNAVAILABLE');

  try {
    return await adaptador.transporte({
      servico: adaptador.c.servico,
      instancia: adaptador.c.instancia,
      caminho,
      headers: cabecalhosDoServico(adaptador.c),
      ...(adaptador.c.nuvem ? { nuvem: adaptador.c.nuvem } : {})
    });
  } catch (erro) {
    if (erro instanceof ErroServico) throw erro;
    throw new ErroServico('SERVICE_UNAVAILABLE');
  }
}

/** Busca o recurso remoto pelo caminho oficial de GitHub, Jira ou Qase. */
export async function obterRecursoDoServico(adaptador: PartesDoAdaptador, id: string) {
  try {
    const caminho = adaptador.c.servico === 'jira'
      ? '/rest/api/3/project/' + codificarParaUrl(id)
      : adaptador.c.servico === 'qase'
        ? '/v1/project/' + codificarParaUrl(id)
        : '/repositories/' + codificarParaUrl(id);

    const resposta = await lerComCredencial(adaptador, caminho);
    const recurso = adaptador.c.servico === 'qase'
      ? itemQase.parse(resposta).result
      : resposta;
    return recursoDaResposta(adaptador.c, recurso);
  } catch (erro) {
    if (erro instanceof ErroServico) throw erro;
    throw new ErroServico('SERVICE_RESPONSE_INVALID');
  }
}
