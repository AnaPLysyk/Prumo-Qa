/** Lê, registra, consulta e exclui atividades do diário de cada projeto. */
import fs from "node:fs";
import { falharCom } from "../../compartilhado/erros.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import { limitesHistorico, Evento, eventoSchema } from "../contratos.js";
import path from "node:path";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { achadoELacuna } from "../regras/resumoDoDiario.js";
import { pino } from "pino";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";

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
