/** Informa se existe nova versão que a pessoa ainda não reconheceu. */
import { compararVersoes } from '../../versoes.js';
import { lerPreferencias } from '../configuracoes/armazenarPreferencias.js';

/** Indicador persistente (funciona offline): há release mais nova que a instalada, ainda não reconhecida pela pessoa. */
export function avisoPendente(instalada: string, base?: string) {
  const p = lerPreferencias(base); const d = p.disponivel;
  if (!d || compararVersoes(d.versao, instalada) <= 0) return { indicador: false as const };
  if (p.versaoVisualizada && compararVersoes(d.versao, p.versaoVisualizada) <= 0) return { indicador: false as const };
  return { indicador: true as const, versao: d.versao, notas: d.notas };
}
