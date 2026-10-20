/** Comando "prumo metricas": mostra os indicadores do diário. */
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { consultarAtividades } from '../logs/banco/consultarAtividades.js';
import { calcularMetricas } from '../metricas/servico.js';
import { avisarHistoricoIncompleto } from './saidaDoTerminal.js';
import { imprimirJson } from './saidaDoTerminal.js';
import { textoSeguroNoTerminal } from './saidaDoTerminal.js';

export function comandoMetricas(p:Projeto,json=false) {
  const m=calcularMetricas(consultarAtividades(p));avisarHistoricoIncompleto(m.problems);
  if(json)imprimirJson(m);else console.log(`MÉTRICAS · ${textoSeguroNoTerminal(p.manifesto.name)}\n${m.complete?'Histórico válido':'HISTÓRICO PARCIAL'}\nOperações: ${m.totalOperations} · Chamadas MCP: ${m.mcpCalls}\nContextos: ${m.contextAnalyses} · Revisões: ${m.coverageReviews}\nAchados: ${m.findings} · Recomendações: ${m.recommendations}\nLacunas: ${m.gaps} · Redundâncias candidatas: ${m.candidateRedundancies}\nExecuções solicitadas: ${m.executionsRequested}\nPASS: ${m.executions.PASS} · FAIL: ${m.executions.FAIL} · BLOCKED: ${m.executions.BLOCKED} · NOT_RUN: ${m.executions.NOT_RUN}\nErros: ${m.errors} · Sem término observado: ${m.unfinished}\nDuração média: ${m.averageDurationMs===null?'indisponível':m.averageDurationMs+' ms'}\nÚltima atividade: ${m.lastActivity??'nenhuma'}\nTokens/custos: ${m.providerMetrics}\nAlterações aplicadas pela IA: não observadas pelo Prumo.`);
}
