/** Grava o início ou o término de uma operação no arquivo próprio dela, com nível, impressão digital e fsync. */
import fs from 'node:fs';
import { pino } from 'pino';
import { falharCom } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Evento, limitesHistorico } from '../contratos.js';

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
