/** Abre um contexto com todas as versões do histórico. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarTodosOsContextos } from '../banco/carregarTodosOsContextos.js';
import { resumirContextos } from './resumirContextos.js';
import { ultimaVersaoDoContexto } from './versoesDoContexto.js';

export function obterContexto(p: Projeto, id: string, base?: string) {
  const { itens } = carregarTodosOsContextos(p, base); const alvo = itens.find(i => i.arq.id === id); if (!alvo) throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');
  const r = resumirContextos(itens).find(x => x.id === id)!; const u = ultimaVersaoDoContexto(alvo.arq);
  return { ...r, texto: u.conteudo.texto, historico: alvo.arq.historico.map(e => ({ versao: e.versao, em: e.em, acao: e.acao, estado: e.estado, por: e.por, conteudoHash: e.conteudoHash, titulo: e.conteudo.titulo, texto: e.conteudo.texto, outroId: e.detalhe?.outroId ?? null, substituidoPor: e.detalhe?.substituidoPor ?? null })) };
}
