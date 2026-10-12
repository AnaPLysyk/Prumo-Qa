/** Procura no ticket do Jira um comentário que o Prumo já publicou (pelo marcador), para não publicar duas vezes. */
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';

export async function procurarComentarioNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, marcador: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira');
  return v.adaptador.procurarComentario(v.recurso, ticket, marcador);
}
