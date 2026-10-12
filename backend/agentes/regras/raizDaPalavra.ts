/** Encurta uma palavra para achar variações (ex.: testes → test). */

export const raizDaPalavra = (t: string) => (t.length > 5 ? t.slice(0, t.length - 2) : t);
