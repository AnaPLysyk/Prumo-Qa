/** Verifica se a versão instalada está registrada no histórico oficial. */
import type { Versao } from './definirFormatoVersao.js';

/** A versão instalada precisa existir no histórico (package.json, histórico e tag devem concordar). */
export function conferirInstalada(versoes: Versao[], instalada: string) {
  if (!versoes.some(v => v.version === instalada)) throw new Error(`VERSIONS_MISSING: ${instalada} não consta no histórico.`);
}
