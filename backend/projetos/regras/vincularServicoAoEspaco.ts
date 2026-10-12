/** Liga o projeto a um recurso de um serviço (ex.: projeto Jira ABC) depois de validado. */
import { randomUUID } from 'node:crypto';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Recurso, Servico, vinculoSchema } from '../tipos/espacos.js';

/** Seleção da lista não é confiança: o adaptador revalida o recurso antes de chamar esta função. */
export function vincularServicoAoEspaco(id:string,servico:Servico,conexaoId:string,recurso:Recurso,base?:string){
  return atualizarEspaco(id,e=>{const antigo=e.vinculos.find(v=>v.servico===servico);if(antigo)throw new Error('WORKSPACE_LINK_EXISTS');
    const v=vinculoSchema.parse({id:randomUUID(),servico,conexaoId,recurso,validadoEm:new Date().toISOString(),estado:'VALIDO'});e.vinculos.push(v);eventoEspaco(e,'VINCULADO',{servico,vinculoId:v.id});},base);
}
