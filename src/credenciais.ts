import {z} from 'zod';
import {lerLocal,gravarLocal} from './armazenamentoLocal.js';

/** Injetado pelo processo principal; o núcleo não importa Electron nem expõe o cofre ao MCP. */
export type Protetor={disponivel:()=>boolean;proteger:(valor:string)=>Buffer;abrir:(valor:Buffer)=>string};
const schema=z.object({version:z.literal(1),entradas:z.record(z.string().max(20000))}).strict();
const idValido=(id:string)=>z.string().uuid().parse(id);
export function cofreCredenciais(protetor:Protetor,base?:string){
  const exigir=()=>{if(!protetor.disponivel())throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');};
  return {
    salvar(id:string,valor:string){idValido(id);exigir();if(!valor||valor.length>6000||/[\x00-\x1f]/.test(valor))throw new Error('CREDENTIAL_INVALID');const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);try{r.entradas[id]=protetor.proteger(valor).toString('base64');}catch{throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');}gravarLocal('credenciais.json',r,base);},
    ler(id:string){idValido(id);exigir();const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);if(!r.entradas[id])throw new Error('CREDENTIAL_UNAVAILABLE');try{return protetor.abrir(Buffer.from(r.entradas[id]!,'base64'));}catch{throw new Error('CREDENTIAL_UNAVAILABLE');}},
    remover(id:string){idValido(id);const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);delete r.entradas[id];gravarLocal('credenciais.json',r,base);}
  };
}
