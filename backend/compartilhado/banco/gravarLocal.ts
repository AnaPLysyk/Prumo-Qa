/** Grava um arquivo de dados JSON do Prumo de forma segura: escreve numa cópia temporária e só então substitui o original. */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { arquivoLocal } from './arquivoLocal.js';
import { semLinks } from '../seguranca/semLinks.js';

export function gravarLocal(nome:string,valor:unknown,base?:string) {
  const alvo=arquivoLocal(nome,base);const texto=JSON.stringify(valor);if(Buffer.byteLength(texto)>2*1024*1024)throw new Error('LOCAL_DATA_LIMIT');
  if(fs.existsSync(alvo)){const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1)throw new Error('LOCAL_FILE_INVALID');}
  fs.mkdirSync(path.dirname(alvo),{recursive:true,mode:0o700});semLinks(alvo);
  const tmp=alvo+'.'+randomUUID()+'.tmp';
  try{fs.writeFileSync(tmp,texto,{flag:'wx',mode:0o600});fs.renameSync(tmp,alvo);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
