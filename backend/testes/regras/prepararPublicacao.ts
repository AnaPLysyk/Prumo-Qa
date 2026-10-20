/** Mostra a prévia do comentário de resultado que seria publicado no Jira. */
import { obterTrabalho } from '../../agendamentos/repositorioFila.js';
import { publicacaoDoTrabalho } from '../banco/publicacaoDoTrabalho.js';
import { montarComentario } from './montarComentario.js';
import { obterEspaco } from '../../projetos/repositorio.js';

/** Prévia: nada é gravado nem enviado. */
export function prepararPublicacao(trabalhoId: string, b?: string) {
  const t = obterTrabalho(trabalhoId, b); const c = montarComentario(t, obterEspaco(t.espacoId, b).nome);
  const existente = publicacaoDoTrabalho(t.id, b);
  return { ticket: t.ticket!, texto: c.texto, estado: existente?.estado ?? 'NAO_PUBLICADO', comentarioId: existente?.comentarioId ?? null };
}
