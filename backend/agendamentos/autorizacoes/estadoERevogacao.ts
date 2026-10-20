/** Ciclo de vida das autorizações: limite, validade, esgotamento e revogação. */
import { AutorizacaoExecucao, PoliticaEscrita, PoliticaPublicacao, Registro } from '../tipos/autorizacoes.js';
import { gravarAutorizacoes, lerAutorizacoes } from '../banco/autorizacoes.js';

/** Libera espaço somente removendo autorizações antigas que não estão mais vigentes. */
export function abrirEspacoDeAutorizacoes<T extends { criadaEm: string }>(
  lista: T[],
  vigente: (item: T) => boolean
): T[] {
  if (lista.length < 300) return lista;

  const antigas = lista
    .filter(item => !vigente(item))
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
    .slice(0, lista.length - 299);

  const descartadas = new Set(antigas);
  return lista.filter(item => !descartadas.has(item));
}

/** Uma autorização revogada, expirada ou esgotada nunca é considerada vigente. */
export function estadoDaAutorizacao(
  autorizacao: AutorizacaoExecucao | PoliticaEscrita | PoliticaPublicacao,
  agora = new Date()
): 'VIGENTE' | 'EXPIRADA' | 'REVOGADA' | 'ESGOTADA' {
  const esgotada = 'usadas' in autorizacao
    ? autorizacao.usadas >= autorizacao.maxPublicacoes
    : autorizacao.usos >= autorizacao.maxUsos;

  if (autorizacao.revogadaEm) return 'REVOGADA';
  if (Date.parse(autorizacao.validaAte) <= agora.getTime()) return 'EXPIRADA';
  return esgotada ? 'ESGOTADA' : 'VIGENTE';
}

/** Registra a revogação apenas uma vez e preserva a data original. */
export function revogarAutorizacao<L extends 'execucoes' | 'escritas' | 'publicacoes'>(
  lista: L,
  id: string,
  base?: string,
  agora = new Date()
): Registro[L][number] {
  const registro = lerAutorizacoes(base);
  const autorizacao = (registro[lista] as Registro[L][number][]).find(item => item.id === id);
  if (!autorizacao) throw new Error('AUTH_NOT_FOUND');

  autorizacao.revogadaEm ??= agora.toISOString();
  gravarAutorizacoes(registro, base);
  return autorizacao;
}
