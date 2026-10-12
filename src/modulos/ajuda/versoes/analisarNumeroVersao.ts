/** Divide o número de versão em maior, menor e correção. */
import { semver } from './definirFormatoVersao.js';

/** [maior, menor, correção] ou null quando não é uma versão semântica estrita (sem sufixos). */
export function analisarVersao(v: string): [number, number, number] | null {
  const m = semver.exec(v.trim().replace(/^v/, ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
