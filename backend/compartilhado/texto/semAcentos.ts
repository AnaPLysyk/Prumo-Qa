/** Deixa o texto em minúsculas e sem acentos para comparar palavras. */

export const semAcentos = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
