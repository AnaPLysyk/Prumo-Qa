/** Simplifica um título (espaços e minúsculas) para comparar casos. */

export const tituloComparavel = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
