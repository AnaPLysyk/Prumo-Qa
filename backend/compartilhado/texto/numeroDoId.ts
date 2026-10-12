/** Converte um id de texto em número inteiro positivo (ou nada). */

export const numeroDoId = (v?: string) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
