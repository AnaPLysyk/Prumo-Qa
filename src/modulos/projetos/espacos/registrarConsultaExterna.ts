/** Registra no histórico uma consulta a serviço externo. */
import type {Servico} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function registrarConsulta(id:string,servico:Servico,codigo:string,base?:string){return atualizar(id,e=>eventoEspaco(e,'CONSULTA',{servico,codigo}),base);}
