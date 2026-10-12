/** Acompanha o diário ao vivo (prumo logs --follow) até a pessoa interromper. */
import { setTimeout as esperar } from 'node:timers/promises';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { consultarAtividades } from '../banco/consultarAtividades.js';
import { Evento } from '../tipos/atividade.js';

export async function acompanharLogs(p:Projeto,emitir:(e:Evento)=>void,opcoes:{signal:AbortSignal;base?:string;intervalMs?:number;problemas?:(p:ReturnType<typeof consultarAtividades>['problems'])=>void}) {
  const vistos=new Set<string>();let ultimosProblemas='';
  while(!opcoes.signal.aborted) {
    const h=consultarAtividades(p,opcoes.base);
    for(const e of h.events) {const chave=e.operationId+e.phase;if(!vistos.has(chave)){vistos.add(chave);emitir(e);}}
    const problemas=JSON.stringify(h.problems);if(problemas!==ultimosProblemas&&h.problems.length)opcoes.problemas?.(h.problems);ultimosProblemas=problemas;
    try{await esperar(opcoes.intervalMs??1000,undefined,{signal:opcoes.signal});}catch(e){if(!opcoes.signal.aborted)throw e;}
  }
}
