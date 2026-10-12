/** Marca a versão nova como vista: o ponto do sino apaga até sair outra mais nova. */
import { analisarVersao } from '../../ajuda/versoes/analisarVersao.js';
import { compararVersoes } from '../../ajuda/versoes/compararVersoes.js';
import { gravarPreferencias } from '../../configuracoes/banco/gravarPreferencias.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';

/** A pessoa viu a versão: o indicador some até existir uma versão mais nova. Nunca regride. */
export function marcarVersaoVista(v: string, base?: string) {
  if (!analisarVersao(v)) throw new Error('INVALID_VERSION: versão inválida.');
  const p = lerPreferencias(base); if (p.versaoVisualizada && compararVersoes(v, p.versaoVisualizada) < 0) return p;
  return gravarPreferencias({ ...p, versaoVisualizada: v }, base);
}
