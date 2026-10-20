/** Menu interativo do terminal com o painel do projeto. */
import { createInterface } from 'node:readline/promises';
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { versaoDoPacote } from '../compartilhado/versaoDoPacote.js';
import { consultarAtividades } from '../logs/banco/consultarAtividades.js';
import { calcularMetricas } from '../metricas/servico.js';
import { avisarHistoricoIncompleto } from './saidaDoTerminal.js';
import { comandoAtividade } from './consultasDoTerminal.js';
import { comandoConectar } from './comandoConectar.js';
import { comandoEvidencias } from './consultasDoTerminal.js';
import { comandoLogs } from './comandoLogs.js';
import { comandoMetricas } from './consultasDoTerminal.js';
import { imprimirJson } from './saidaDoTerminal.js';
import { textoSeguroNoTerminal } from './saidaDoTerminal.js';

export async function menuDoTerminal(p:Projeto,contrato?:string,json=false) {
  const painel=()=>{
    const h=consultarAtividades(p);const m=calcularMetricas(h);avisarHistoricoIncompleto(h.problems);
    const ultima=h.activities.filter(e=>e.origin==='MCP').at(-1);
    if(json){imprimirJson({project:p.manifesto.name,metrics:m,lastObservedClient:ultima?.client??null,connection:'Sessão ativa não verificada'});return;}
    console.log(`\nPRUMO QA · v${versaoDoPacote}\nEngenharia de Qualidade\n\nProjeto: ${textoSeguroNoTerminal(p.manifesto.name)}\nConexão: ${ultima?'última chamada observada de '+ultima.client+' (identidade declarada)':'nenhuma chamada MCP observada'}; sessão ativa não verificada\nÚltima atividade: ${m.lastActivity??'nenhuma'}\n\nATIVIDADES\n  ${m.totalOperations} operações registradas · ${m.mcpCalls} via MCP\n  ${m.coverageReviews} revisões de cobertura\n  ${m.gaps} lacunas identificadas\n\nOPÇÕES\n  1. Atividades recentes\n  2. Logs\n  3. Métricas\n  4. Evidências\n  5. Conexões\n  0. Sair\n`);
  };
  painel();if(json||!process.stdin.isTTY||!process.stdout.isTTY)return;
  const rl=createInterface({input:process.stdin,output:process.stdout});rl.setPrompt('Opção: ');rl.prompt();
  try {for await(const op of rl){
    if(op.trim()==='0')break;
    try {switch(op.trim()) {
      case '1':comandoAtividade(p);break;case '2':await comandoLogs(p,false,false);break;case '3':comandoMetricas(p);break;
      case '4':await comandoEvidencias(p);break;
      case '5':await comandoConectar(p,'codex',contrato,false,false);console.log('Para confirmar a configuração use prumo conectar codex com esta mesma raiz.');break;
      default:console.log('Escolha uma opção de 0 a 5.');
    }}catch(e){console.error(textoSeguroNoTerminal((e as Error).message));}
    painel();rl.prompt();
  }}finally{rl.close();}
}
