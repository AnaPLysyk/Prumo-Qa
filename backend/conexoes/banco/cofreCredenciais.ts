/** Guarda, lê e apaga as credenciais do Jira, Qase e GitHub protegidas pelo Windows (DPAPI); nunca em texto aberto. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { validarIdDaCredencial } from './validarIdDaCredencial.js';
import { Protetor, schema } from '../tipos/credenciais.js';

export function cofreCredenciais(protetor:Protetor,base?:string){
  const exigir=()=>{if(!protetor.disponivel())throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');};
  return {
    salvar(id:string,valor:string){validarIdDaCredencial(id);exigir();if(!valor||valor.length>6000||/[\x00-\x1f]/.test(valor))throw new Error('CREDENTIAL_INVALID');const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);try{r.entradas[id]=protetor.proteger(valor).toString('base64');}catch{throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');}gravarLocal('credenciais.json',r,base);},
    ler(id:string){validarIdDaCredencial(id);exigir();const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);if(!r.entradas[id])throw new Error('CREDENTIAL_UNAVAILABLE');try{return protetor.abrir(Buffer.from(r.entradas[id]!,'base64'));}catch{throw new Error('CREDENTIAL_UNAVAILABLE');}},
    remover(id:string){validarIdDaCredencial(id);const r=lerLocal('credenciais.json',schema,{version:1,entradas:{}},base);delete r.entradas[id];gravarLocal('credenciais.json',r,base);}
  };
}
