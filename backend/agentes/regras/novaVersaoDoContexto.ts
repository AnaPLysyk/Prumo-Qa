/** Cria a próxima versão do histórico de um contexto (quem, quando, ação, estado e selo). */
import { hashDoConteudoDoContexto } from './hashDoConteudoDoContexto.js';
import { seloDaVersaoDoContexto } from './seloDaVersaoDoContexto.js';
import { Conteudo, Entrada, Estado } from '../tipos/contexto.js';

export function novaVersaoDoContexto(acao: Entrada['acao'], estado: Estado, conteudo: Conteudo, por: string, anterior: Entrada | null, detalhe?: Entrada['detalhe']): Entrada {
  const base = { versao: (anterior?.versao ?? 0) + 1, em: new Date().toISOString(), acao, estado, por: por.slice(0, 100), conteudo, conteudoHash: hashDoConteudoDoContexto(conteudo), ...(detalhe ? { detalhe } : {}), anterior: anterior?.selo ?? null };
  return { ...base, selo: seloDaVersaoDoContexto(base) };
}
