/** Trata um valor como lista (ou lista vazia se não for). */

export const comoLista = (v:unknown):unknown[] => Array.isArray(v)?v:[];
