/** Registra no histórico que ocorreu uma escrita externa autorizada. */
import type {Servico} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function registrarEscrita(id:string,servico:Servico,codigo:string,base?:string){return atualizar(id,e=>eventoEspaco(e,'ESCRITA',{servico,codigo}),base);}
