/** Diz o estado de uma autorização de execução ou de uma política de escrita ou publicação: vigente, expirada, revogada ou esgotada. */
import { AutorizacaoExecucao, PoliticaEscrita, PoliticaPublicacao } from '../tipos/autorizacoes.js';

/** As políticas de publicação contam `usadas` até `maxPublicacoes`; as demais contam `usos` até `maxUsos`. */
export function estadoDaAutorizacao(a: AutorizacaoExecucao | PoliticaEscrita | PoliticaPublicacao, agora = new Date()): 'VIGENTE' | 'EXPIRADA' | 'REVOGADA' | 'ESGOTADA' {
  const esgotada = 'usadas' in a ? a.usadas >= a.maxPublicacoes : a.usos >= a.maxUsos;
  return a.revogadaEm ? 'REVOGADA' : Date.parse(a.validaAte) <= agora.getTime() ? 'EXPIRADA' : esgotada ? 'ESGOTADA' : 'VIGENTE';
}
