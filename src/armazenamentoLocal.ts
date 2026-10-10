import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { diretorioDados, semLinks } from './atividades.js';

/** Arquivos próprios do aplicativo: nomes internos, limites e gravação atômica. */
export function arquivoLocal(nome:string,base?:string) {
  if(!/^[a-z0-9-]+\.(json|bin)$/.test(nome))throw new Error('LOCAL_FILE_INVALID');
  const alvo=path.join(diretorioDados(base),'plataforma',nome);semLinks(alvo);return alvo;
}
export function lerLocal<T>(nome:string,schema:z.ZodType<T>,padrao:T,base?:string):T {
  const alvo=arquivoLocal(nome,base);
  try {const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1||st.size>2*1024*1024)throw new Error();return schema.parse(JSON.parse(fs.readFileSync(alvo,'utf8')));}
  catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return padrao;throw new Error('LOCAL_DATA_INVALID');}
}
export function gravarLocal(nome:string,valor:unknown,base?:string) {
  const alvo=arquivoLocal(nome,base);const texto=JSON.stringify(valor);if(Buffer.byteLength(texto)>2*1024*1024)throw new Error('LOCAL_DATA_LIMIT');
  if(fs.existsSync(alvo)){const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1)throw new Error('LOCAL_FILE_INVALID');}
  fs.mkdirSync(path.dirname(alvo),{recursive:true,mode:0o700});semLinks(alvo);
  const tmp=alvo+'.'+randomUUID()+'.tmp';
  try{fs.writeFileSync(tmp,texto,{flag:'wx',mode:0o600});fs.renameSync(tmp,alvo);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
