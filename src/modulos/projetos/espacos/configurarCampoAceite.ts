/** Guarda o campo Jira escolhido para os critérios de aceite. */
import {z} from 'zod';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function configurarAceite(id:string,campo:string,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico==='jira');if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.campoAceite=z.string().regex(/^customfield_\d+$/).parse(campo);eventoEspaco(e,'EDITADO',{servico:'jira',vinculoId:v.id});},base);}
