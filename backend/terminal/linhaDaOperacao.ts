/** Escreve uma operação do diário numa linha legível. */
import { descreverAchados } from '../logs/regras/resumoDoDiario.js';
import { Evento } from '../logs/tipos/atividade.js';

export function linhaDaOperacao(e:Evento) {
  return `${e.at} · ${e.tool} · ${e.origin}/${e.client} (identidade declarada) · ${e.phase==='start'?'SEM TÉRMINO OBSERVADO':e.state} · ${e.durationMs} ms\n  ${e.summary.findings} achados · ${e.summary.recommendations} recomendações · ${e.summary.gaps} lacunas · ${e.summary.candidateRedundancies} redundâncias candidatas\n  operação ${e.operationId}${e.summary.code?' · '+e.summary.code:''}${e.summary.evidenceJobId?' · evidência '+e.summary.evidenceJobId+(e.summary.evidencePersisted===false?' (não persistida)':''):''}${e.summary.types.length?'\n  '+descreverAchados(e):''}`;
}
