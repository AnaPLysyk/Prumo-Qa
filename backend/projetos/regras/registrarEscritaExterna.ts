/** Anota no histórico do projeto que algo foi escrito num serviço externo. */
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Servico } from '../tipos/espacos.js';

export function registrarEscritaExterna(id:string,servico:Servico,codigo:string,base?:string){return atualizarEspaco(id,e=>eventoEspaco(e,'ESCRITA',{servico,codigo}),base);}
