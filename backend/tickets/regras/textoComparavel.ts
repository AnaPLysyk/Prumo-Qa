/** Simplifica um texto (minúsculas, sem acentos e sem pontuação) para comparar propostas. */

export const textoComparavel = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
