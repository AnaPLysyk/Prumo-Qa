/** Lista autorizações de execução e políticas de publicação com o estado de cada uma (vigente, expirada, revogada, esgotada). */
import { estadoDaAutorizacao } from '../autorizacoes/estadoDaAutorizacao.js';
import { estadoDaPoliticaDeEscrita } from '../autorizacoes/estadoDaPoliticaDeEscrita.js';
import { estadoDaPoliticaDePublicacao } from '../autorizacoes/estadoDaPoliticaDePublicacao.js';
import { listarAutorizacoes } from '../banco/listarAutorizacoes.js';

export function listarPermissoes(espacoId?: string, base?: string, agora = new Date()) {
  const a = listarAutorizacoes(base);
  return { execucoes: a.execucoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })), publicacoes: a.publicacoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaPoliticaDePublicacao(x, agora) })),
    // Políticas de escrita agendada (2.9, resultados no Qase): visíveis para poderem ser revogadas, não só expirar.
    escritas: a.escritas.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaPoliticaDeEscrita(x, agora) })) };
}
