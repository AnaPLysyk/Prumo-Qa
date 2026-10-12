/** Acha no código de um teste os ids de casos do Qase (ex.: qase(12), @qase-12). */
import { QASE_PADROES } from '../tipos/catalogoDeTestes.js';

export function idsQase(trecho: string): string[] {
  const ids = new Set<string>();
  for (const re of QASE_PADROES) for (const m of trecho.matchAll(re)) {
    const projeto = m.groups?.projeto; const lista = m.groups?.ids ?? '';
    for (const bruto of lista.split(/[\s,]+/)) { const n = bruto.replace(/['"[\]]/g, ''); if (/^\d{1,9}$/.test(n)) ids.add(projeto ? projeto + '-' + n : n); }
  }
  return [...ids].slice(0, 20);
}
