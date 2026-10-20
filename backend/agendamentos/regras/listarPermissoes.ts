/** Lista autorizações de execução e políticas de publicação com o estado de cada uma (vigente, expirada, revogada, esgotada). */
import { estadoDaAutorizacao } from '../autorizacoes/estadoDaAutorizacao.js';
import { lerAutorizacoes } from '../banco/autorizacoes.js';

export function listarPermissoes(espacoId?: string, base?: string, agora = new Date()) {
  const a = lerAutorizacoes(base);
  return { execucoes: a.execucoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })), publicacoes: a.publicacoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })),
    // Políticas de escrita agendada (resultados no Qase): visíveis para poderem ser revogadas, não só expirar.
    escritas: a.escritas.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })) };
}
