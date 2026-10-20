/** Reúne helpers de comentario da funcionalidade, mantendo cada operação identificável pelo nome. */


/** Texto que identifica no Jira o comentário de uma execução ("Prumo-Execução: <id>"). */

export const marcadorDaExecucao = (trabalhoId: string) => `Prumo-Execução: ${trabalhoId}`;

/** Monta um parágrafo do comentário no formato do Jira. */

export const paragrafoDoComentario = (t: string) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });
