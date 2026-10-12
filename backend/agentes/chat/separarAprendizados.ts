/** Separa da resposta da IA as linhas "APRENDIZADO:" (viram rascunho) do restante. */
import { limitesConhecimento } from '../tipos/conhecimento.js';

/** Separa as linhas "APRENDIZADO:" do texto da IA externa (no máximo duas). */
export function separarAprendizados(texto: string) {
  const aprendizados: string[] = []; const resto = texto.split('\n').filter((l) => { const m = l.match(/^\s*[-*]?\s*APRENDIZADO:\s*(.{4,})$/i); if (m && aprendizados.length < 2) { aprendizados.push(m[1]!.trim().slice(0, limitesConhecimento.texto)); return false; } return !m; }).join('\n');
  return { texto: resto, aprendizados };
}
