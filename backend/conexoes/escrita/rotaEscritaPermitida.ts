/** Diz se um método e caminho de escrita está na lista fechada do serviço (sem DELETE, sem truques no caminho). */
import { rotas } from '../tipos/rotasDeEscrita.js';
import { Servico } from '../../projetos/tipos/espacos.js';

export function rotaEscritaPermitida(servico: Servico, metodo: string, caminho: string): boolean {
  if (/%2e|%2f|%5c|\.\.|[\x00-\x1f\\]/i.test(caminho)) return false; // sem traversal nem separadores codificados
  return rotas[servico].some(r => r.metodo === metodo && r.caminho.test(caminho));
}
