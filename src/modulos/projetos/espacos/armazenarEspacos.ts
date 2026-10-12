/** Lê e grava projetos locais e registra o histórico de alterações. */
import {z} from 'zod';
import {lerLocal, gravarLocal} from '../../../armazenamentoLocal.js';
import {registro, evento, type Espaco} from './definicoesEspaco.js';

export const ler=(base?:string)=>lerLocal('espacos.json',registro,{version:1,espacos:[]},base);
export const gravar=(r:z.infer<typeof registro>,base?:string)=>gravarLocal('espacos.json',registro.parse(r),base);
export const listarEspacos=(base?:string)=>ler(base).espacos;
export function obterEspaco(id:string,base?:string){const e=listarEspacos(base).find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');return e;}
export function atualizar(id:string,fn:(e:Espaco)=>void,base?:string){const r=ler(base);const e=r.espacos.find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');fn(e);gravar(r,base);return e;}
export function eventoEspaco(e:Espaco,acao:z.infer<typeof evento>['acao'],extra:Partial<z.infer<typeof evento>>={}){e.historico.push(evento.parse({at:new Date().toISOString(),acao,...extra}));e.historico=e.historico.slice(-1000);}
