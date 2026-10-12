/** Gera um número fixo a partir de um texto, para variar a saudação sem sorteio. */

/** Índice estável a partir de um texto (FNV-1a de 32 bits), para escolher variações sem aleatoriedade. */
export function numeroDoTexto(texto: string): number {
  let h = 0x811c9dc5; for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h;
}
