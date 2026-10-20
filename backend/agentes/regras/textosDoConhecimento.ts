/** Reúne textos do conhecimento da funcionalidade, mantendo cada operação identificável pelo nome. */
import { nomeValido, pare } from "../tipos/conhecimento.js";
import { semAcentos } from "../../compartilhado/texto.js";

export function normalizarNome(bruto: string): string | null {
  const n = bruto.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim(); if (!nomeValido.test(n)) return null;
  return n.split(' ').map((p) => (p.length > 2 ? p[0]!.toLocaleUpperCase('pt-BR') + p.slice(1) : p)).join(' ');
}

/** Encurta uma palavra para achar variações (ex.: testes → test). */

export const raizDaPalavra = (t: string) => (t.length > 5 ? t.slice(0, t.length - 2) : t);

/** Termos significativos de uma frase (sem acento, sem palavras vazias). */
export function termosDaFrase(frase: string): string[] { return [...new Set(semAcentos(frase).split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !pare.has(t)))].slice(0, 12); }
