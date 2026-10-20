/** Comandos de consulta do terminal: atividades, evidências e indicadores. */
import { Projeto } from "../compartilhado/tipos/projeto.js";
import { consultarAtividades } from "../logs/banco/consultarAtividades.js";
import { avisarHistoricoIncompleto, imprimirJson, linhaDaOperacao, textoSeguroNoTerminal } from "./saidaDoTerminal.js";
import { consultarEvidencias } from "../testes/repositorioEvidencias.js";
import { chamadaRegistrada } from "./chamadaRegistrada.js";
import { calcularMetricas } from "../metricas/servico.js";

export function comandoAtividade(p:Projeto,json=false) {
  const h=consultarAtividades(p);avisarHistoricoIncompleto(h.problems);
  if(json)imprimirJson(h);else {console.log(`ATIVIDADES · ${textoSeguroNoTerminal(p.manifesto.name)}\nHistórico: ${h.directory}`);console.log(h.activities.length?h.activities.slice(-20).reverse().map(linhaDaOperacao).join('\n\n'):'Não existem atividades registradas.');}
}

export async function comandoEvidencias(p:Projeto,id?:string,json=false) {
  const r=await chamadaRegistrada(p,'consultar_evidencias',{jobId:id},()=>consultarEvidencias(p,id));
  if(json)imprimirJson(r);else {console.log(`EVIDÊNCIAS · ${textoSeguroNoTerminal(p.manifesto.name)}`);console.log(r.results.length?r.results.map(e=>`${e.endedAt} · ${e.status} · ${e.jobId}\n  ${textoSeguroNoTerminal(e.reason)}\n  ${e.evidencePath}`).join('\n'): 'NOT_RUN · Nenhuma evidência para esta consulta.');}
}

export function comandoMetricas(p:Projeto,json=false) {
  const m=calcularMetricas(consultarAtividades(p));avisarHistoricoIncompleto(m.problems);
  if(json)imprimirJson(m);else console.log(`MÉTRICAS · ${textoSeguroNoTerminal(p.manifesto.name)}\n${m.complete?'Histórico válido':'HISTÓRICO PARCIAL'}\nOperações: ${m.totalOperations} · Chamadas MCP: ${m.mcpCalls}\nContextos: ${m.contextAnalyses} · Revisões: ${m.coverageReviews}\nAchados: ${m.findings} · Recomendações: ${m.recommendations}\nLacunas: ${m.gaps} · Redundâncias candidatas: ${m.candidateRedundancies}\nExecuções solicitadas: ${m.executionsRequested}\nPASS: ${m.executions.PASS} · FAIL: ${m.executions.FAIL} · BLOCKED: ${m.executions.BLOCKED} · NOT_RUN: ${m.executions.NOT_RUN}\nErros: ${m.errors} · Sem término observado: ${m.unfinished}\nDuração média: ${m.averageDurationMs===null?'indisponível':m.averageDurationMs+' ms'}\nÚltima atividade: ${m.lastActivity??'nenhuma'}\nTokens/custos: ${m.providerMetrics}\nAlterações aplicadas pela IA: não observadas pelo Prumo.`);
}
