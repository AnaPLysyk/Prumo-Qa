/** Marca a versão reconhecida pela pessoa sem permitir regressão de versão. */
import { analisarVersao, compararVersoes } from '../../versoes.js';
import { lerPreferencias, gravar } from '../configuracoes/armazenarPreferencias.js';

/** A pessoa viu a versão: o indicador some até existir uma versão mais nova. Nunca regride. */
export function marcarVisualizada(v: string, base?: string) {
  if (!analisarVersao(v)) throw new Error('INVALID_VERSION: versão inválida.');
  const p = lerPreferencias(base); if (p.versaoVisualizada && compararVersoes(v, p.versaoVisualizada) < 0) return p;
  return gravar({ ...p, versaoVisualizada: v }, base);
}
