/** Devolve um texto da bandeja/avisos no idioma escolhido, preenchendo os valores {x}. */
import { Chave, Idioma, T } from '../tipos/textosDaBandeja.js';

export const textoNoIdioma = (chave: Chave, idioma: Idioma, vars: Record<string, string | number> = {}) => T[chave][idioma].replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
