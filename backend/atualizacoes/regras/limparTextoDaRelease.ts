/** Tira caracteres de controle e limita o texto vindo da release. */

export const limparTextoDaRelease = (s: string) => s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ').slice(0, 4000);
