/** Atualiza o resultado da validação de um vínculo com serviço externo. */
import {z} from 'zod';
import {vinculoSchema, type Servico, type Recurso} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function estadoVinculo(id:string,servico:Servico,estado:z.infer<typeof vinculoSchema>['estado'],codigo?:string,recurso?:Recurso,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.estado=estado;if(estado==='VALIDO')v.validadoEm=new Date().toISOString();if(recurso)v.recurso=recurso;eventoEspaco(e,'VALIDACAO',{servico,vinculoId:v.id,...(codigo?{codigo}:{})});},base);}
