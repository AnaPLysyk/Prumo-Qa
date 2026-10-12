/** Converte texto simples em documento ADF para o Jira. */
/** Texto simples -> documento Atlassian (ADF) só com parágrafos. O Prumo nunca envia HTML nem marcação executável ao Jira. */
export function textoParaAdf(texto: string): { type: 'doc'; version: 1; content: unknown[] } {
  const linhas = texto.replace(/\r\n?/g, '\n').split('\n').slice(0, 400);
  return { type: 'doc', version: 1, content: linhas.map(l => (l ? { type: 'paragraph', content: [{ type: 'text', text: l.slice(0, 2000) }] } : { type: 'paragraph' })) };
}
