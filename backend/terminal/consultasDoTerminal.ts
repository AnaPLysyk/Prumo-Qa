/** Comandos de consulta do terminal: atividades, evidências e indicadores. */
import { Projeto } from '../compartilhado/projeto/contratos.js';
import { consultarAtividades } from '../logs/banco/atividades.js';
import {
  avisarHistoricoIncompleto, imprimirJson, linhaDaOperacao, textoSeguroNoTerminal
} from './saidaDoTerminal.js';
import { consultarEvidencias } from '../testes/banco/evidencias.js';
import { chamadaRegistrada } from './chamadaRegistrada.js';
import { calcularMetricas } from '../metricas/servico.js';

/** Resume as últimas 20 atividades, sem apresentar um histórico parcial como completo. */
export function comandoAtividade(projeto: Projeto, json = false) {
  const historico = consultarAtividades(projeto);
  avisarHistoricoIncompleto(historico.problems);
  if (json) {
    imprimirJson(historico);
    return;
  }

  console.log(
    'ATIVIDADES · ' + textoSeguroNoTerminal(projeto.manifesto.name) +
    '\nHistórico: ' + historico.directory
  );
  console.log(
    historico.activities.length
      ? historico.activities.slice(-20).reverse().map(linhaDaOperacao).join('\n\n')
      : 'Não existem atividades registradas.'
  );
}

/** Consulta evidências somente através do canal registrado de leitura. */
export async function comandoEvidencias(projeto: Projeto, id?: string, json = false) {
  const resposta = await chamadaRegistrada(
    projeto,
    'consultar_evidencias',
    { jobId: id },
    () => consultarEvidencias(projeto, id)
  );
  if (json) {
    imprimirJson(resposta);
    return;
  }

  console.log('EVIDÊNCIAS · ' + textoSeguroNoTerminal(projeto.manifesto.name));
  console.log(
    resposta.results.length
      ? resposta.results.map(item =>
          item.endedAt + ' · ' + item.status + ' · ' + item.jobId +
          '\n  ' + textoSeguroNoTerminal(item.reason) +
          '\n  ' + item.evidencePath
        ).join('\n')
      : 'NOT_RUN · Nenhuma evidência para esta consulta.'
  );
}

/** Mostra métricas observadas pelo Prumo sem inventar dados de custo ou execução de IA. */
export function comandoMetricas(projeto: Projeto, json = false) {
  const metricas = calcularMetricas(consultarAtividades(projeto));
  avisarHistoricoIncompleto(metricas.problems);
  if (json) {
    imprimirJson(metricas);
    return;
  }

  console.log([
    'MÉTRICAS · ' + textoSeguroNoTerminal(projeto.manifesto.name),
    metricas.complete ? 'Histórico válido' : 'HISTÓRICO PARCIAL',
    'Operações: ' + metricas.totalOperations + ' · Chamadas MCP: ' + metricas.mcpCalls,
    'Contextos: ' + metricas.contextAnalyses + ' · Revisões: ' + metricas.coverageReviews,
    'Achados: ' + metricas.findings + ' · Recomendações: ' + metricas.recommendations,
    'Lacunas: ' + metricas.gaps + ' · Redundâncias candidatas: ' + metricas.candidateRedundancies,
    'Execuções solicitadas: ' + metricas.executionsRequested,
    'PASS: ' + metricas.executions.PASS +
      ' · FAIL: ' + metricas.executions.FAIL +
      ' · BLOCKED: ' + metricas.executions.BLOCKED +
      ' · NOT_RUN: ' + metricas.executions.NOT_RUN,
    'Erros: ' + metricas.errors + ' · Sem término observado: ' + metricas.unfinished,
    'Duração média: ' + (metricas.averageDurationMs === null
      ? 'indisponível' : metricas.averageDurationMs + ' ms'),
    'Última atividade: ' + (metricas.lastActivity ?? 'nenhuma'),
    'Tokens/custos: ' + metricas.providerMetrics,
    'Alterações aplicadas pela IA: não observadas pelo Prumo.'
  ].join('\n'));
}
