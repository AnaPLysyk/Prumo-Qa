/** Lógica e contratos de compartilhado: operações relacionadas no mesmo módulo. */


/** Codifica um texto para ir dentro de um endereço (URL). */

export const codificarParaUrl = encodeURIComponent;

/** Escreve uma data em formato brasileiro, ou "—" quando não há data. */

export const dataEmPortugues = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

/** Deixa o texto em minúsculas e sem acentos para comparar palavras. */

export const semAcentos = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Texto curto da pessoa ou padrão explícito, com limite de 300 caracteres. */
export const valorOuPadrao = (valor: string | undefined, padrao: string) =>
  valor && valor.trim() ? valor.trim().slice(0, 300) : padrao;
