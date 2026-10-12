/** Mede de 0 a 1 o quanto dois conjuntos de palavras se parecem, para achar propostas repetidas. */

export const semelhancaEntrePalavras = (a: Set<string>, b: Set<string>) => { if (!a.size || !b.size) return 0; let i = 0; for (const t of a) if (b.has(t)) i++; return i / (a.size + b.size - i); };
