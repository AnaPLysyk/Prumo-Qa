/** Comando "prumo atividade": mostra as 20 últimas operações. */
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { consultarAtividades } from '../logs/banco/consultarAtividades.js';
import { avisarHistoricoIncompleto } from './avisarHistoricoIncompleto.js';
import { imprimirJson } from './imprimirJson.js';
import { linhaDaOperacao } from './linhaDaOperacao.js';
import { textoSeguroNoTerminal } from './textoSeguroNoTerminal.js';

export function comandoAtividade(p:Projeto,json=false) {
  const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);
  if(json)imprimirJson(h);else {console.log(`ATIVIDADES · ${textoSeguroNoTerminal(p.manifesto.name)}\nHistórico: ${h.directory}`);console.log(h.activities.length?h.activities.slice(-20).reverse().map(linhaDaOperacao).join('\n\n'):'Não existem atividades registradas.');}
}
