/** Versões de contexto com hashes e selos que protegem a cadeia de alterações. */
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Arquivo, Conteudo, Entrada, Estado } from '../tipos/contexto.js';

export const hashDoConteudoDoContexto = (conteudo: Conteudo) =>
  hash(JSON.stringify([
    conteudo.tipo, conteudo.titulo, conteudo.texto, conteudo.chave ?? null,
    conteudo.origem.tipo, conteudo.origem.referencia
  ]));

export const seloDaVersaoDoContexto = (entrada: Omit<Entrada, 'selo'>) =>
  hash(JSON.stringify([
    entrada.anterior, entrada.conteudoHash, entrada.acao, entrada.estado,
    entrada.em, entrada.por, entrada.versao, entrada.detalhe ?? null
  ]));

export const ultimaVersaoDoContexto = (arquivo: Arquivo) =>
  arquivo.historico.at(-1)!;

export function novaVersaoDoContexto(
  acao: Entrada['acao'],
  estado: Estado,
  conteudo: Conteudo,
  por: string,
  anterior: Entrada | null,
  detalhe?: Entrada['detalhe']
): Entrada {
  const entrada = {
    versao: (anterior?.versao ?? 0) + 1,
    em: new Date().toISOString(),
    acao, estado, por: por.slice(0, 100), conteudo,
    conteudoHash: hashDoConteudoDoContexto(conteudo),
    ...(detalhe ? { detalhe } : {}),
    anterior: anterior?.selo ?? null
  };
  return { ...entrada, selo: seloDaVersaoDoContexto(entrada) };
}
