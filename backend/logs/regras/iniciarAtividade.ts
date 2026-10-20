/** iniciarAtividade: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import fs from "node:fs";
import { falharCom } from "../../compartilhado/erros.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import { limitesHistorico, Evento, eventoSchema, Origem, codigos, estados, ferramentas, orientacoes, referenciaSchema, resumoSchema } from "../contratos.js";
import path from "node:path";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { achadoELacuna } from "./resumoDoDiario.js";
import { pino } from "pino";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// --- atividades ---
export function arquivosDoDiario(pasta:string):string[] {
  semLinks(pasta);
  try {
    const arquivos=fs.readdirSync(pasta).filter(n=>/^[a-f0-9-]{36}\.jsonl$/.test(n));
    if(arquivos.length>limitesHistorico.arquivos)falharCom('HISTORY_FILE_LIMIT');
    return arquivos;
  } catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e; }
}

export function consultarAtividades(p:Projeto,base?:string) {
  const pasta=pastaAtividades(p,base);const eventos:Evento[]=[];const problemas:{file:string;code:string}[]=[];let bytes=0;
  for(const nome of arquivosDoDiario(pasta)) {
    const alvo=path.join(pasta,nome);
    try {
      semLinks(alvo);const st=fs.lstatSync(alvo);
      if(!st.isFile()||st.nlink!==1||st.size>limitesHistorico.arquivoBytes)falharCom('HISTORY_FILE_INVALID');
      bytes+=st.size;if(bytes>limitesHistorico.leituraBytes)falharCom('HISTORY_READ_LIMIT');
      const raw=fs.readFileSync(alvo,'utf8');
      if(Buffer.byteLength(raw)>limitesHistorico.arquivoBytes)falharCom('HISTORY_FILE_INVALID');
      const linhas=raw.split('\n');const incompleta=linhas.pop();
      if(incompleta)problemas.push({file:nome,code:'TRUNCATED_LINE'});
      if(!linhas.length || linhas.length>2)falharCom('HISTORY_CORRUPT');
      const lidos=linhas.map(l=>{
        const raw=JSON.parse(l);const e=eventoSchema.parse(raw);
        // O digest corresponde à ordem efetivamente gravada. Zod projeta as chaves
        // na ordem do esquema; isso não pode invalidar um registro íntegro antigo.
        const {level,digest,...conteudo}=raw;
        if(hash(JSON.stringify(conteudo))!==digest)falharCom('HISTORY_DIGEST_MISMATCH');
        return e;
      });
      for(const e of lidos)if(e.operationId+'.jsonl'!==nome||e.rootHash!==hash(p.raiz)||e.projectId!==hash(p.manifesto.id))falharCom('HISTORY_PROJECT_MISMATCH');
      for(const e of lidos) {
        const {level}=e;
        if(level!==(e.state==='ERROR'||e.state==='FAIL'?50:e.state==='BLOCKED'?40:30))falharCom('HISTORY_LEVEL_MISMATCH');
        const s=e.summary;
        if(new Set(s.types.map(t=>t.type)).size!==s.types.length || s.findings!==s.types.reduce((n,t)=>n+t.count,0) || s.recommendations>s.findings || s.gaps!==s.types.filter(t=>achadoELacuna(t.type)).reduce((n,t)=>n+t.count,0) || s.candidateRedundancies!==(s.types.find(t=>t.type==='POTENTIAL_REDUNDANCY')?.count??0))falharCom('HISTORY_COUNTER_MISMATCH');
      }
      if(lidos[0]!.phase!=='start'||lidos[0]!.state!=='STARTED'||lidos[0]!.durationMs!==0)falharCom('HISTORY_CORRUPT');
      if(lidos[1] && (lidos[1].phase!=='end'||lidos[1].state==='STARTED'||lidos[1].tool!==lidos[0]!.tool||lidos[1].origin!==lidos[0]!.origin||lidos[1].client!==lidos[0]!.client||lidos[1].manifestHash!==lidos[0]!.manifestHash||lidos[1].at<lidos[0]!.at))falharCom('HISTORY_CORRUPT');
      eventos.push(...lidos);
    } catch(e) {
      if((e as Error).message==='HISTORY_READ_LIMIT')throw e;
      problemas.push({file:nome,code:'HISTORY_INVALID_RECORD'});
    }
  }
  eventos.sort((a,b)=>a.at.localeCompare(b.at)||a.operationId.localeCompare(b.operationId)||(a.phase==='start'?-1:1));
  const operacoes=new Map<string,Evento>();for(const e of eventos)operacoes.set(e.operationId,e);
  return {projectId:hash(p.manifesto.id),rootHash:hash(p.raiz),directory:pasta,events:eventos,activities:[...operacoes.values()].sort((a,b)=>a.at.localeCompare(b.at)),problems:problemas,complete:!problemas.length};
}

/**
 * Exclusão controlada do histórico operacional de um projeto (nunca código nem evidências).
 * Só apaga arquivos <uuid>.jsonl regulares, um a um, sem links; falhas parciais (arquivo em uso, permissão) são devolvidas.
 */
export function excluirAtividades(p:Projeto,base?:string) {
  const pasta=pastaAtividades(p,base);const falhas:{file:string;code:string}[]=[];let apagados=0;
  for(const nome of arquivosDoDiario(pasta)) {
    const alvo=path.join(pasta,nome);
    try { semLinks(alvo);const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1)falharCom('HISTORY_FILE_INVALID');fs.unlinkSync(alvo);apagados++; }
    catch(e) { falhas.push({file:nome,code:(e as NodeJS.ErrnoException).code??(e as Error).message.slice(0,40)}); }
  }
  try { fs.rmdirSync(pasta); } catch { /* restam arquivos ou a pasta não existe */ }
  return {deleted:apagados,failed:falhas};
}

export function gravarNoDiario(alvo:string,evento:Omit<Evento,'level'|'digest'>,inicio:boolean) {
  semLinks(alvo);
  const nivel=evento.state==='ERROR'||evento.state==='FAIL'?'error':evento.state==='BLOCKED'?'warn':'info';
  // Uma operação tem seu próprio arquivo: nenhuma disputa de append entre processos.
  const fd=fs.openSync(alvo,inicio?'wx':'a',0o600);
  try {
    const st=fs.fstatSync(fd);
    if(!st.isFile() || st.nlink!==1 || st.size>limitesHistorico.arquivoBytes)falharCom('HISTORY_FILE_INVALID');
    const logger=pino({base:null,timestamp:false,redact:{paths:['password','token','secret','authorization','input.password','input.token'],censor:'[REDACTED]'}},{write(line:string){
      if(st.size+Buffer.byteLength(line)>limitesHistorico.arquivoBytes)falharCom('HISTORY_SIZE_LIMIT');
      const bytes=Buffer.from(line);let offset=0;
      while(offset<bytes.length)offset+=fs.writeSync(fd,bytes,offset,bytes.length-offset);
    }});
    logger[nivel]({...evento,digest:hash(JSON.stringify(evento))});fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
}

/** Diz se `alvo` fica dentro de `raiz` (ou é a própria raiz). */
function caminhoDentroDe(raiz:string,alvo:string) { const r=path.relative(raiz,alvo);return !r || (r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r)); }

export function pastaAtividades(p:Projeto, base?:string):string {
  const dados=diretorioDados(base);
  const alvo=path.resolve(dados,'projects',hash(p.raiz+'\0'+p.manifesto.id));
  if(caminhoDentroDe(p.raiz,path.resolve(dados)) || caminhoDentroDe(p.raiz,alvo))falharCom('HISTORY_INSIDE_PROJECT');
  semLinks(alvo);return alvo;
}

export const eAtalho = (alvo: string) => { try { return fs.lstatSync(alvo).isSymbolicLink(); } catch { return false; } };

// --- iniciarAtividade ---
// ── iniciarAtividade ──
const resumoVazio = ():z.infer<typeof resumoSchema> => ({findings:0,recommendations:0,gaps:0,candidateRedundancies:0,types:[]});

const comoLista = (v: unknown): unknown[] => Array.isArray(v) ? v : [];

const comoObjeto = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};

/** Registra falhas de observabilidade sem alterar o resultado da operação original. */
const avisarFalhaDoDiario = (fase: string, id: string) => {
  process.stderr.write(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado; verifique PRUMO_DATA_DIR/permissões/limites.\n`);
};

export function iniciarAtividade(p:Projeto,tool:string,origem:Origem,entrada:unknown={},opcoes:{base?:string;diagnostico?:(fase:string,id:string)=>void}={}) {
  const id=randomUUID();const inicio=performance.now();const r=comoObjeto(entrada);
  const cliente=origem.origin==='CLI'?'terminal':/sdk|test|acceptance|demonstracao|lab-avaliador|inspector/i.test(origem.client??'')?'sdk':/codex/i.test(origem.client??'')?'codex':/claude/i.test(origem.client??'')?'claude':'outro';
  const e:Omit<Evento,'level'|'digest'>={version:1,operationId:id,projectId:hash(p.manifesto.id),rootHash:hash(p.raiz),manifestHash:p.manifestoHash,
    tool:ferramentas.includes(tool as typeof ferramentas[number])?tool as typeof ferramentas[number]:'desconhecida',origin:origem.origin,client:cliente,clientIdentity:'declarada',clientClassificationVersion:2,
    phase:'start',at:new Date().toISOString(),durationMs:0,state:'STARTED',input:tool==='revisar_cobertura'?{candidates:Math.min(comoLista(r.candidates).length,1000000),existingTests:Math.min(comoLista(r.existingTests).length,1000000),hasRequirement:typeof r.requirement==='string'&&!!r.requirement.trim(),hasSource:typeof r.source==='string'&&!!r.source.trim()}:{},summary:resumoVazio()};
  const avisar=opcoes.diagnostico??avisarFalhaDoDiario;let alvo:string|undefined;let encerrado=false;
  try {
    const pasta=pastaAtividades(p,opcoes.base);
    if(arquivosDoDiario(pasta).length>=limitesHistorico.arquivos)falharCom('HISTORY_FILE_LIMIT');
    fs.mkdirSync(pasta,{recursive:true,mode:0o700});semLinks(pasta);
    alvo=path.join(pasta,id+'.jsonl');gravarNoDiario(alvo,e,true);
  } catch { alvo=undefined;avisar('start',id); }
  return {id, finalizar(resultado:unknown,erro=false) {
    if(encerrado)return;encerrado=true;
    const saida=comoObjeto(resultado);const summary=resumoVazio();const encontrados=comoLista(saida.findings);
    // Guarda só referências efetivamente devolvidas/consultadas, sem texto, título, origem privada ou aprovador.
    const referencias:Record<string,unknown>[] = tool==='contexto_projeto'
      ? comoLista(comoObjeto(saida.contextos).referencias).map(v=>({...comoObjeto(v),uso:'incluido_na_resposta'}))
      : tool==='revisar_cobertura' ? comoLista(saida.facts).filter(v=>comoObjeto(v).kind==='context_used').map(v=>({...comoObjeto(v),uso:'consultado_na_revisao'})) : [];
    const refs = referencias.map(v=>referenciaSchema.safeParse({id:v.id,versao:v.versao,hash:v.hash,estado:v.estado,uso:v.uso})).filter(v=>v.success).map(v=>v.data!);
    if(refs.length)summary.contextReferences=refs.slice(0,100);
    summary.findings=encontrados.length;
    summary.recommendations=encontrados.filter(f=>typeof comoObjeto(f).recommendation==='string'&&!!(comoObjeto(f).recommendation as string).trim()).length;
    const tipos=new Map<string,number>();
    for(const f of encontrados) { const t=comoObjeto(f).type;const tipo=typeof t==='string'&&Object.hasOwn(orientacoes,t)?t:'OTHER_FINDING';tipos.set(tipo,(tipos.get(tipo)??0)+1); }
    summary.types=[...tipos].map(([type,count])=>({type,count}));
    summary.candidateRedundancies=tipos.get('POTENTIAL_REDUNDANCY')??0;
    summary.gaps=summary.types.filter(t=>achadoELacuna(t.type)).reduce((n,t)=>n+t.count,0);
    if(z.string().uuid().safeParse(saida.jobId).success)summary.evidenceJobId=saida.jobId as string;
    if(typeof saida.persisted==='boolean')summary.evidencePersisted=saida.persisted;
    if(typeof saida.executed==='boolean')summary.executed=saida.executed;
    const codigo=typeof saida.reason==='string'?saida.reason.split(':')[0]!:typeof saida.codigo==='string'?saida.codigo:'';
    if(codigos.has(codigo))summary.code=codigo;
    if(erro)summary.code=summary.code??'TOOL_ERROR';
    const estado=saida.status??saida.state;
    const state=erro?'ERROR':typeof estado==='string'&&estados.includes(estado as typeof estados[number])&&estado!=='STARTED'?estado as Evento['state']:'OK';
    try { if(alvo)gravarNoDiario(alvo,{...e,phase:'end',at:new Date().toISOString(),durationMs:Math.round((performance.now()-inicio)*1000)/1000,state,summary},false); }
    catch { avisar('end',id); }
  }};
}

// ── observar ──
export async function observar<T>(p:Projeto,tool:string,origem:Origem,entrada:unknown,fn:()=>Promise<T>,opcoes:Parameters<typeof iniciarAtividade>[4]={}) {
  const atividade=iniciarAtividade(p,tool,origem,entrada,opcoes);
  try { const r=await fn();atividade.finalizar(r);return r; }
  catch(e) { atividade.finalizar(e,true);throw e; }
}
