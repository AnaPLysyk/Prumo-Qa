/** Comando "prumo logs": mostra o diário ou acompanha ao vivo com --follow. */
import { Projeto } from '../compartilhado/projeto/contratos.js';
import { consultarAtividades } from '../logs/banco/atividades.js';
import { setTimeout as esperar } from 'node:timers/promises';
import { Evento } from '../logs/contratos.js';
import { avisarHistoricoIncompleto } from './saidaDoTerminal.js';
import { linhaDaOperacao } from './saidaDoTerminal.js';

export async function comandoLogs(p:Projeto,json:boolean,follow:boolean) {
  const emitir=(e:Evento)=>console.log(json?JSON.stringify(e):`${e.phase==='start'?'INÍCIO':'TÉRMINO'} · ${linhaDaOperacao(e)}`);
  if(!follow){const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);h.events.forEach(emitir);if(!json&&!h.events.length)console.log('Não existem logs registrados.');return;}
  if(!json)console.log('Acompanhando logs locais. Ctrl+C encerra. Aguardando operações...');
  const ctrl=new AbortController();const parar=()=>ctrl.abort();process.on('SIGINT',parar);process.on('SIGTERM',parar);
  try{await acompanharLogs(p,emitir,{signal:ctrl.signal,problemas: avisarHistoricoIncompleto});}finally{process.off('SIGINT',parar);process.off('SIGTERM',parar);}
}

/** Acompanha somente os eventos locais até a interrupção solicitada. */
export async function acompanharLogs(p:Projeto,emitir:(e:Evento)=>void,opcoes:{signal:AbortSignal;base?:string;intervalMs?:number;problemas?:(p:ReturnType<typeof consultarAtividades>['problems'])=>void}) {
  const vistos=new Set<string>();let ultimosProblemas='';
  while(!opcoes.signal.aborted) {
    const h=consultarAtividades(p,opcoes.base);
    for(const e of h.events) {const chave=e.operationId+e.phase;if(!vistos.has(chave)){vistos.add(chave);emitir(e);}}
    const problemas=JSON.stringify(h.problems);if(problemas!==ultimosProblemas&&h.problems.length)opcoes.problemas?.(h.problems);ultimosProblemas=problemas;
    try{await esperar(opcoes.intervalMs??1000,undefined,{signal:opcoes.signal});}catch(e){if(!opcoes.signal.aborted)throw e;}
  }
}
