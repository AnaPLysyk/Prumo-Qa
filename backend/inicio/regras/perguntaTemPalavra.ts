/** Diz se a pergunta contém alguma das palavras-chave. */

export const perguntaTemPalavra = (p: string, ...ks: string[]) => ks.some(k => p.includes(k));
