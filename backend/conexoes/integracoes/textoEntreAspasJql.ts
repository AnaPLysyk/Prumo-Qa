/** Coloca um texto entre aspas para uma busca JQL, escapando caracteres. */

export const textoEntreAspasJql = (s: string) => '"' + s.replace(/[\\"]/g, '\\$&').replace(/[\x00-\x1f]/g, ' ') + '"';
