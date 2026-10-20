/** Verifica erros, elegibilidade e repetição antes de publicar resultados. */
import { ErroServico } from "../conexoes/integracoes/ErroServico.js";
import { politicaCobre } from "../agendamentos/autorizacoes/politicasDaAutorizacao.js";
import { Trabalho } from "../agendamentos/tipos/fila.js";
import { obterTrabalho } from "../agendamentos/banco/fila.js";
import { publicacaoDoTrabalho } from "./banco/publicacoes.js";
import { montarComentario } from "./regras/montarComentario.js";
import { obterEspaco } from "../projetos/banco/projetos.js";

export const codigoDoErroDePublicacao = (e: unknown) => e instanceof ErroServico ? e.codigo : (e as Error)?.message?.match(/^[A-Z_]{3,60}/)?.[0] ?? 'JIRA_PUBLISH_FAILED';

/** Trabalhos agendados concluídos com ticket e política que cubra: prepara o registro; senão marca a razão (nunca publica sem política). */
export function elegivelParaPublicar(t: Trabalho, b?: string, agora = new Date()): 'SIM' | 'NAO_APLICAVEL' | 'SEM_POLITICA' {
  if (t.estado !== 'CONCLUIDO' || !t.ticket || (t.resultado?.status !== 'PASS' && t.resultado?.status !== 'FAIL')) return 'NAO_APLICAVEL';
  if (t.jira.estado === 'PUBLICADO') return 'NAO_APLICAVEL';
  return politicaCobre(t.espacoId, t.ticket, t.tipo, b, agora) ? 'SIM' : 'SEM_POLITICA';
}

/** Prévia: nada é gravado nem enviado. */
export function prepararPublicacao(trabalhoId: string, b?: string) {
  const t = obterTrabalho(trabalhoId, b); const c = montarComentario(t, obterEspaco(t.espacoId, b).nome);
  const existente = publicacaoDoTrabalho(t.id, b);
  return { ticket: t.ticket!, texto: c.texto, estado: existente?.estado ?? 'NAO_PUBLICADO', comentarioId: existente?.comentarioId ?? null };
}

/** Diz se vale tentar publicar de novo (tempo esgotado, serviço fora ou limite de consultas). */

export const publicacaoPodeRepetir = (cod: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);
