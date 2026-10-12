/** Atualiza o estado da ligação com um serviço (válida, sem permissão, indisponível...) depois de uma conferência. */
import { z } from 'zod';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Recurso, Servico, vinculoSchema } from '../tipos/espacos.js';

export function atualizarEstadoDoVinculo(id:string,servico:Servico,estado:z.infer<typeof vinculoSchema>['estado'],codigo?:string,recurso?:Recurso,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.estado=estado;if(estado==='VALIDO')v.validadoEm=new Date().toISOString();if(recurso)v.recurso=recurso;eventoEspaco(e,'VALIDACAO',{servico,vinculoId:v.id,...(codigo?{codigo}:{})});},base);}
