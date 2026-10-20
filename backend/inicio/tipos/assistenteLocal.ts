/** Formato da resposta do assistente local do Início (linhas e fontes) e as palavras ignoradas nas perguntas. */

/**
 * Assistente local do Prumo: responde só com o que existe neste computador (contextos aprovados, propostas, runs,
 * execuções, agenda). Não é um modelo de IA, não consulta a rede e não inventa: sem dado, diz que não encontrou.
 */
export type Fonte = { rotulo: string; aba: string };

export type Resposta = { linhas: string[]; fontes: Fonte[]; modo: 'LOCAL' };

export const pare = new Set(['qual', 'quais', 'como', 'onde', 'quando', 'sobre', 'para', 'com', 'que', 'uma', 'uns', 'dos', 'das', 'tem', 'tenho', 'este', 'esta', 'esse', 'essa', 'projeto', 'prumo', 'tudo', 'algum', 'alguma', 'esta', 'esse']);
