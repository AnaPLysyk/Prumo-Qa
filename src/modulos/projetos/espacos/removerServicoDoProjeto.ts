/** Remove somente a ligação entre o projeto e um serviço externo. */
import type {Servico} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function removerVinculoServico(id:string,servico:Servico,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');e.vinculos=e.vinculos.filter(v=>v.servico!==servico);eventoEspaco(e,'REMOVIDO',{servico,vinculoId:v.id});},base);}
