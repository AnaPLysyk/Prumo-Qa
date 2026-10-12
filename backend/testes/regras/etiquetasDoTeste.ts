/** Lê as etiquetas @tag de um trecho de teste (ex.: @smoke). */

export const etiquetasDoTeste = (texto: string) => [...new Set([...texto.matchAll(/@([a-z][a-z0-9_-]{1,24})/gi)].map(m => m[1]!.toLowerCase()))].slice(0, 8);
