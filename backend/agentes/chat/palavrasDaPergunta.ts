/** Separa as palavras de uma pergunta já sem acentos. */
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export const palavrasDaPergunta = (p: string) => semAcentos(p).split(/[^a-z0-9@]+/).filter(Boolean);
