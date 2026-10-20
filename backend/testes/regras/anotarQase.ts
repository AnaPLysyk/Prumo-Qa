/** Marca em cada teste encontrado onde ele termina e quais casos do Qase cita. */

import { CasoTeste } from '../tipos/catalogoDeTestes.js';
import { QASE_PADROES } from '../tipos/catalogoDeTestes.js';

export function idsQase(trecho: string): string[] {
  const ids = new Set<string>();
  for (const re of QASE_PADROES) for (const m of trecho.matchAll(re)) {
    const projeto = m.groups?.projeto; const lista = m.groups?.ids ?? '';
    for (const bruto of lista.split(/[\s,]+/)) { const n = bruto.replace(/['"[\]]/g, ''); if (/^\d{1,9}$/.test(n)) ids.add(projeto ? projeto + '-' + n : n); }
  }
  return [...ids].slice(0, 20);
}


export function anotarQase(texto: string, casos: CasoTeste[]) {
  const linhas = texto.split(/\r?\n/); const ordem = [...casos].sort((a, b) => a.linha - b.linha);
  ordem.forEach((c, i) => {
    const fim = i + 1 < ordem.length ? ordem[i + 1]!.linha - 1 : linhas.length; c.fim = Math.max(c.linha, fim);
    // A closing line of the preceding test may contain qase.id(). Never inherit it.
    let inicio = c.linha - 1;
    while (inicio > 0 && /^\s*(?:@|\/\/|#|\/\*|\*)/.test(linhas[inicio - 1]!)) inicio--;
    let final = c.fim;
    if (i + 1 < ordem.length) while (final > c.linha && /^\s*(?:@|\/\/|#|\/\*|\*)/.test(linhas[final - 1]!)) final--;
    const ids = idsQase(linhas.slice(inicio, final).join('\n')); if (ids.length) c.qase = ids;
    c.tags = c.tags.filter((t) => !/^qase/.test(t));
  });
}
