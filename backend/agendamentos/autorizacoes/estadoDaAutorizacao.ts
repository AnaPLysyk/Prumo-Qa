/** Diz o estado de uma autorização de execução: vigente, expirada, revogada ou esgotada. */
import { AutorizacaoExecucao } from '../tipos/autorizacoes.js';

/** Estado legível para a interface, sem expor hash completo. */
export function estadoDaAutorizacao(a: AutorizacaoExecucao, agora = new Date()): 'VIGENTE' | 'EXPIRADA' | 'REVOGADA' | 'ESGOTADA' {
  return a.revogadaEm ? 'REVOGADA' : Date.parse(a.validaAte) <= agora.getTime() ? 'EXPIRADA' : a.usos >= a.maxUsos ? 'ESGOTADA' : 'VIGENTE';
}
