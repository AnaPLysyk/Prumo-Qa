/** Monta um parágrafo do comentário no formato do Jira. */

export const paragrafoDoComentario = (t: string) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });
