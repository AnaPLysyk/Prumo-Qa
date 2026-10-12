/** Registra um serviço externo validado como vínculo do projeto. */
import {randomUUID} from 'node:crypto';
import {vinculoSchema, type Servico, type Recurso} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

/** Seleção da lista não é confiança: o adaptador revalida o recurso antes de chamar esta função. */
export function gravarVinculo(id:string,servico:Servico,conexaoId:string,recurso:Recurso,base?:string){
  return atualizar(id,e=>{const antigo=e.vinculos.find(v=>v.servico===servico);if(antigo)throw new Error('WORKSPACE_LINK_EXISTS');
    const v=vinculoSchema.parse({id:randomUUID(),servico,conexaoId,recurso,validadoEm:new Date().toISOString(),estado:'VALIDO'});e.vinculos.push(v);eventoEspaco(e,'VINCULADO',{servico,vinculoId:v.id});},base);
}
