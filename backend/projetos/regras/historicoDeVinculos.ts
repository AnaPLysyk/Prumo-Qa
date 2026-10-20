/** Reúne historico de vinculos da funcionalidade, mantendo cada operação identificável pelo nome. */
import { atualizarEspaco } from "../banco/atualizarEspaco.js";
import { eventoEspaco } from "./eventoEspaco.js";
import { Servico, Recurso, vinculoSchema } from "../tipos/espacos.js";
import { z } from "zod";

export function registrarConsultaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'CONSULTA',{servico,codigo}),base);}

export function registrarEscritaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'ESCRITA',{servico,codigo}),base);}

export function removerVinculoServico(id:string,servico:Servico,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');e.vinculos=e.vinculos.filter(v=>v.servico!==servico);eventoEspaco(e,'REMOVIDO',{servico,vinculoId:v.id});},base);}

export function atualizarEstadoDoVinculo(id:string,servico:Servico,estado:z.infer<typeof vinculoSchema>['estado'],codigo?:string,recurso?:Recurso,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.estado=estado;if(estado==='VALIDO')v.validadoEm=new Date().toISOString();if(recurso)v.recurso=recurso;eventoEspaco(e,'VALIDACAO',{servico,vinculoId:v.id,...(codigo?{codigo}:{})});},base);}
