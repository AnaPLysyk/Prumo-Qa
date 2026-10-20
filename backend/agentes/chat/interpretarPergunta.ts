/** Reúne interpretar pergunta da funcionalidade, mantendo cada operação identificável pelo nome. */
import { semAcentos } from "../../compartilhado/texto/semAcentos.js";

export const palavrasDaPergunta = (p: string) => semAcentos(p).split(/[^a-z0-9@]+/).filter(Boolean);

/** Diz se um termo aparece na pergunta (frase exata, prefixo~ ou palavra). */

/** Termo simples = palavra inteira (com plural); "~" = início de palavra; com espaço = expressão a partir do início de uma palavra. */
export function termoCasaComPergunta(termo: string, palavras: string[], frase: string) {
  if (termo.includes(' ')) return (' ' + frase).includes(' ' + termo);
  if (termo.endsWith('~')) { const r = termo.slice(0, -1); return palavras.some((w) => w.startsWith(r)); }
  return palavras.some((w) => w === termo || w === termo + 's' || w === termo + 'es');
}
