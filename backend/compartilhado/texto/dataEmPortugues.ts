/** Escreve uma data em formato brasileiro, ou "—" quando não há data. */

export const dataEmPortugues = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
