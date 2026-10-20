/** Comando "prumo evidencias": lista as evidências ou uma pelo id. */
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { consultarEvidencias } from '../testes/repositorioEvidencias.js';
import { chamadaRegistrada } from './chamadaRegistrada.js';
import { imprimirJson } from './saidaDoTerminal.js';
import { textoSeguroNoTerminal } from './saidaDoTerminal.js';

export async function comandoEvidencias(p:Projeto,id?:string,json=false) {
  const r=await chamadaRegistrada(p,'consultar_evidencias',{jobId:id},()=>consultarEvidencias(p,id));
  if(json)imprimirJson(r);else {console.log(`EVIDÊNCIAS · ${textoSeguroNoTerminal(p.manifesto.name)}`);console.log(r.results.length?r.results.map(e=>`${e.endedAt} · ${e.status} · ${e.jobId}\n  ${textoSeguroNoTerminal(e.reason)}\n  ${e.evidencePath}`).join('\n'): 'NOT_RUN · Nenhuma evidência para esta consulta.');}
}
