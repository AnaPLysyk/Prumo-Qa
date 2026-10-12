/** Encontra os testes (describe/test/it) de um arquivo JavaScript/TypeScript. */
import { classificarTeste } from './classificarTeste.js';
import { etiquetasDoTeste } from './etiquetasDoTeste.js';
import { CasoTeste, limites } from '../tipos/catalogoDeTestes.js';

export function analisarArquivoJs(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
  const linhas = texto.split(/\r?\n/); const casos: CasoTeste[] = []; let feature: string | null = null; let atual: CasoTeste | null = null;
  // Tags de arquivo: só comentários de cabeçalho e títulos de describe; o título de um teste não contamina os outros.
  const arquivoTags = etiquetasDoTeste(linhas.slice(0, 12).filter(l => /^\s*(\/\/|\/\*|\*)/.test(l) || /\bdescribe\b/.test(l)).join('\n'));
  linhas.forEach((l, i) => {
    const d = /\b(?:test\.)?describe(?:\.(?:serial|parallel|only|skip))?\s*\(\s*(['"`])((?:\\.|(?!\1).)+)\1/.exec(l); if (d && !feature) feature = d[2]!.slice(0, 120);
    const t = /\b(?:it|test)(?:\.(?:only|skip|fixme))?\s*\(\s*(?:qase(?:\.id)?\(\s*\[?[\d\s,'"]+\]?\s*,\s*)?(['"`])((?:\\.|(?!\1).)+)\1/.exec(l);
    if (t && casos.length < limites.testesPorArquivo) { const titulo = t[2]!.slice(0, 200); const tags = [...new Set([...etiquetasDoTeste(titulo), ...arquivoTags])]; const c = classificarTeste(rel, texto, tags); atual = { titulo, ...c, linha: i + 1, passos: [], tags }; casos.push(atual); }
    for (const s of l.matchAll(/\btest\.step\s*\(\s*(['"`])((?:\\.|(?!\1).)+)\1/g)) if (atual && atual.passos.length < 30) atual.passos.push(s[2]!.slice(0, 160));
  });
  return { feature, casos };
}
