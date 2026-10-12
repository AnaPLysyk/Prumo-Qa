/** Compara duas versões: negativo se a primeira é mais antiga. */
import { analisarVersao } from './analisarVersao.js';

/** Negativo se a < b, zero se iguais, positivo se a > b. Compara números, não texto ("2.10.0" > "2.9.0"). */
export function compararVersoes(a: string, b: string): number {
  const x = analisarVersao(a), y = analisarVersao(b);
  if (!x || !y) throw new Error('INVALID_VERSION: versão semântica inválida.');
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
  return 0;
}
