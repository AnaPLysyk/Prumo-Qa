/** Abre um projeto do Prumo, aplica uma alteração e grava de volta. */
import { gravarEspacos } from './gravarEspacos.js';
import { lerEspacos } from './lerEspacos.js';
import { Espaco } from '../tipos/espacos.js';

export function atualizarEspaco(id:string,fn:(e:Espaco)=>void,base?:string){const r=lerEspacos(base);const e=r.espacos.find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');fn(e);gravarEspacos(r,base);return e;}
