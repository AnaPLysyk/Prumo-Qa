/** Calcula os indicadores do diário (chamadas MCP, revisões, achados, execuções por estado, duração média). */
import { consultarAtividades } from '../../logs/banco/consultarAtividades.js';

export function calcularMetricas(h:ReturnType<typeof consultarAtividades>) {
  const a=h.activities;const finais=a.filter(e=>e.phase==='end');const soma=(campo:'findings'|'recommendations'|'gaps'|'candidateRedundancies')=>finais.reduce((n,e)=>n+e.summary[campo],0);
  const execucoes=a.filter(e=>e.tool==='executar_validacao');
  return {projectId:h.projectId,rootHash:h.rootHash,complete:h.complete,problems:h.problems,totalOperations:a.length,
    mcpCalls:a.filter(e=>e.origin==='MCP').length,contextAnalyses:finais.filter(e=>e.tool==='contexto_projeto'&&e.state==='NOT_VERIFIED').length,
    coverageReviews:finais.filter(e=>e.tool==='revisar_cobertura'&&e.state==='NOT_VERIFIED').length,findings:soma('findings'),recommendations:soma('recommendations'),gaps:soma('gaps'),candidateRedundancies:soma('candidateRedundancies'),
    executionsRequested:execucoes.length,executions:Object.fromEntries(['PASS','FAIL','BLOCKED','NOT_RUN'].map(s=>[s,execucoes.filter(e=>e.state===s).length])),
    errors:a.filter(e=>e.state==='ERROR').length,unfinished:a.filter(e=>e.phase==='start').length,
    averageDurationMs:finais.length?Math.round(finais.reduce((n,e)=>n+e.durationMs,0)/finais.length*1000)/1000:null,
    lastActivity:a.length?[...a].sort((x,y)=>x.at.localeCompare(y.at)).at(-1)!.at:null,
    tokens:null,cost:null,providerMetrics:'indisponíveis: cliente/provedor não forneceu dados verificáveis',appliedChanges:null};
}
