/** Marca em cada teste encontrado onde ele termina e quais casos do Qase cita. */
import { idsQase } from './idsQase.js';
import { CasoTeste } from '../tipos/catalogoDeTestes.js';

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
