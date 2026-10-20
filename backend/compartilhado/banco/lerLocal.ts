/** Lê dados JSON da pasta da conta, valida o formato e mantém o valor inicial quando o arquivo não existe. */
import fs from 'node:fs';
import { z } from 'zod';
import { arquivoLocal } from './arquivoLocal.js';

export function lerLocal<T>(nome:string,schema:z.ZodType<T,z.ZodTypeDef,unknown>,padrao:T,base?:string):T {
  const alvo=arquivoLocal(nome,base);
  try {
    const st=fs.lstatSync(alvo);
    if(!st.isFile()||st.nlink!==1||st.size>2*1024*1024)throw new Error('LOCAL_DATA_INVALID');
    return schema.parse(JSON.parse(fs.readFileSync(alvo,'utf8')));
  } catch(e) {
    if((e as NodeJS.ErrnoException).code==='ENOENT')return padrao;
    throw new Error('LOCAL_DATA_INVALID');
  }
}
