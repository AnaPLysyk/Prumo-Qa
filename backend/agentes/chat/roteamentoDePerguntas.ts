/** Interpreta perguntas e decide quando orquestrar várias especializações. */
import { semAcentos } from "../../compartilhado/texto.js";
import { limitesOrquestracao } from "../tipos/orquestracao.js";

export const palavrasDaPergunta = (p: string) => semAcentos(p).split(/[^a-z0-9@]+/).filter(Boolean);

/** Diz se um termo aparece na pergunta (frase exata, prefixo~ ou palavra). */

/** Termo simples = palavra inteira (com plural); "~" = início de palavra; com espaço = expressão a partir do início de uma palavra. */
export function termoCasaComPergunta(termo: string, palavras: string[], frase: string) {
  if (termo.includes(' ')) return (' ' + frase).includes(' ' + termo);
  if (termo.endsWith('~')) { const r = termo.slice(0, -1); return palavras.some((w) => w.startsWith(r)); }
  return palavras.some((w) => w === termo || w === termo + 's' || w === termo + 'es');
}

/** Devolve os ids dos especialistas, na ordem da pontuação, ou null quando um agente só basta. */
export function planejarOrquestracao(rota: { agente: string; pontos: number }[]): string[] | null {
  const fortes = rota.filter((r) => r.agente !== 'orquestrador' && r.pontos >= limitesOrquestracao.pontosMinimos)
    .sort((a, b) => b.pontos - a.pontos).slice(0, limitesOrquestracao.agentes).map((r) => r.agente);
  return fortes.length >= 2 ? fortes : null;
}
