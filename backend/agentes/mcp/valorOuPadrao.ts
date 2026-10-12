/** Usa o valor informado (limpo e curto) ou o padrão. */

export const valorOuPadrao = (x: string | undefined, padrao: string) => (x && x.trim() ? x.trim().slice(0, 300) : padrao);
