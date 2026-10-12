/** Confere que a versão instalada consta no histórico. */
import { Versao } from '../tipos/versao.js';

/** A versão instalada precisa existir no histórico (package.json, histórico e tag devem concordar). */
export function conferirInstalada(versoes: Versao[], instalada: string) {
  if (!versoes.some(v => v.version === instalada)) throw new Error(`VERSIONS_MISSING: ${instalada} não consta no histórico.`);
}
