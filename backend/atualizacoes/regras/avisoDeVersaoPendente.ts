/** Diz se o sino deve acender: há versão mais nova que a instalada e ainda não vista. */
import { compararVersoes } from '../../ajuda/versoes/compararVersoes.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';

/** Indicador persistente (funciona offline): há release mais nova que a instalada, ainda não reconhecida pela pessoa. */
export function avisoDeVersaoPendente(instalada: string, base?: string) {
  const p = lerPreferencias(base); const d = p.disponivel;
  if (!d || compararVersoes(d.versao, instalada) <= 0) return { indicador: false as const };
  if (p.versaoVisualizada && compararVersoes(d.versao, p.versaoVisualizada) <= 0) return { indicador: false as const };
  return { indicador: true as const, versao: d.versao, notas: d.notas };
}
