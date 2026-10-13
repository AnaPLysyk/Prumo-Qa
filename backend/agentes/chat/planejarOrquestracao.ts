/** Decide se uma pergunta pede mais de um especialista: duas ou mais especializações com pontuação forte no roteamento. */
import { limitesOrquestracao } from '../tipos/orquestracao.js';

/** Devolve os ids dos especialistas, na ordem da pontuação, ou null quando um agente só basta. */
export function planejarOrquestracao(rota: { agente: string; pontos: number }[]): string[] | null {
  const fortes = rota.filter((r) => r.agente !== 'orquestrador' && r.pontos >= limitesOrquestracao.pontosMinimos)
    .sort((a, b) => b.pontos - a.pontos).slice(0, limitesOrquestracao.agentes).map((r) => r.agente);
  return fortes.length >= 2 ? fortes : null;
}
