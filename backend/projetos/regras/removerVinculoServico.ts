/** Remove a ligação do projeto com um serviço (Jira, Qase ou GitHub); nada é apagado no serviço. */
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Servico } from '../tipos/espacos.js';

export function removerVinculoServico(id:string,servico:Servico,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');e.vinculos=e.vinculos.filter(v=>v.servico!==servico);eventoEspaco(e,'REMOVIDO',{servico,vinculoId:v.id});},base);}
