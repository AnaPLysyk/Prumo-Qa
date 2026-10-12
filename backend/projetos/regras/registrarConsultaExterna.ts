/** Anota no histórico do projeto que um serviço externo (Jira, Qase, GitHub) foi consultado. */
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Servico } from '../tipos/espacos.js';

export function registrarConsultaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'CONSULTA',{servico,codigo}),base);}
