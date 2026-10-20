/** Apresentação e avisos do terminal. Centraliza a formatação de saídas públicas. */
import { mascarar } from '../compartilhado/seguranca/mascarar.js';
import { descreverAchados } from '../logs/regras/resumoDoDiario.js';
import { Evento } from '../logs/contratos.js';

export const avisarHistoricoIncompleto = (registros: unknown[]) => {
  if (registros.length) {
    console.error('HISTORY_INCOMPLETE: registros inválidos/truncados excluídos; métricas são parciais.');
    process.exitCode = 3;
  }
};

export const imprimirJson = (valor: unknown) =>
  console.log(JSON.stringify(valor, null, 2));

/** Linha do diário, sempre com indicação de evidências e achados reais. */
export function linhaDaOperacao(evento: Evento) {
  const e = evento;
  return `${e.at} · ${e.tool} · ${e.origin}/${e.client} (identidade declarada) · ${e.phase === 'start' ? 'SEM TÉRMINO OBSERVADO' : e.state} · ${e.durationMs} ms
  ${e.summary.findings} achados · ${e.summary.recommendations} recomendações · ${e.summary.gaps} lacunas · ${e.summary.candidateRedundancies} redundâncias candidatas
  operação ${e.operationId}${e.summary.code ? ' · ' + e.summary.code : ''}${e.summary.evidenceJobId ? ' · evidência ' + e.summary.evidenceJobId + (e.summary.evidencePersisted === false ? ' (não persistida)' : '') : ''}${e.summary.types.length ? '\n  ' + descreverAchados(e) : ''}`;
}

export const textoSeguroNoTerminal = (texto: string) =>
  mascarar(texto).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
