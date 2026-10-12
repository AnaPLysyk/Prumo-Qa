/** Separa os termos importantes de uma frase (mais de 3 letras, sem palavras comuns). */
import { pare } from '../tipos/conhecimento.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

/** Termos significativos de uma frase (sem acento, sem palavras vazias). */
export function termosDaFrase(frase: string): string[] { return [...new Set(semAcentos(frase).split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !pare.has(t)))].slice(0, 12); }
