/** Comando "prumo logs": mostra o diário ou acompanha ao vivo com --follow. */
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { consultarAtividades } from '../logs/banco/consultarAtividades.js';
import { acompanharLogs } from '../logs/regras/acompanharLogs.js';
import { Evento } from '../logs/tipos/atividade.js';
import { avisarHistoricoIncompleto } from './saidaDoTerminal.js';
import { linhaDaOperacao } from './saidaDoTerminal.js';

export async function comandoLogs(p:Projeto,json:boolean,follow:boolean) {
  const emitir=(e:Evento)=>console.log(json?JSON.stringify(e):`${e.phase==='start'?'INÍCIO':'TÉRMINO'} · ${linhaDaOperacao(e)}`);
  if(!follow){const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);h.events.forEach(emitir);if(!json&&!h.events.length)console.log('Não existem logs registrados.');return;}
  if(!json)console.log('Acompanhando logs locais. Ctrl+C encerra. Aguardando operações...');
  const ctrl=new AbortController();const parar=()=>ctrl.abort();process.on('SIGINT',parar);process.on('SIGTERM',parar);
  try{await acompanharLogs(p,emitir,{signal:ctrl.signal,problemas: avisarHistoricoIncompleto});}finally{process.off('SIGINT',parar);process.off('SIGTERM',parar);}
}
