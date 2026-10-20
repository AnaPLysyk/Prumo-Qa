/** Lê o diário do projeto conferindo formato e integridade; arquivos inválidos ficam de fora com aviso. */
import fs from 'node:fs';
import path from 'node:path';
import { falharCom } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { arquivosDoDiario } from './arquivosDoDiario.js';
import { pastaAtividades } from './pastaAtividades.js';
import { achadoELacuna } from '../regras/resumoDoDiario.js';
import { Evento, eventoSchema, limitesHistorico } from '../contratos.js';

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
