/** Separa as palavras importantes (mais de 2 letras) de um texto. */
import { textoComparavel } from './textoComparavel.js';

export const palavrasDoTexto = (s: string) => new Set(textoComparavel(s).split(' ').filter(t => t.length > 2));
