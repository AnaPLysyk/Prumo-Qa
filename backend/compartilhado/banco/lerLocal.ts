/** Lê um arquivo de dados JSON do Prumo e confere o formato; se ainda não existe, devolve o valor inicial. */
import fs from 'node:fs';
import { z } from 'zod';
import { arquivoLocal } from './arquivoLocal.js';

export function lerLocal<T>(nome:string,schema:z.ZodType<T,z.ZodTypeDef,unknown>,padrao:T,base?:string):T {
  const alvo=arquivoLocal(nome,base);
  try {const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1||st.size>2*1024*1024)throw new Error();return schema.parse(JSON.parse(fs.readFileSync(alvo,'utf8')));}
  catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return padrao;throw new Error('LOCAL_DATA_INVALID');}
}
