/** Escolhe qual campo do Jira guarda os critérios de aceite deste projeto. */
import { z } from 'zod';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';

export function configurarAceite(id:string,campo:string,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico==='jira');if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.campoAceite=z.string().regex(/^customfield_\d+$/).parse(campo);eventoEspaco(e,'EDITADO',{servico:'jira',vinculoId:v.id});},base);}
