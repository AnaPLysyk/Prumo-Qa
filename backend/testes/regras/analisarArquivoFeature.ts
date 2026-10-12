/** Encontra os cenários de um arquivo .feature (Gherkin) com suas etiquetas. */
import { classificarTeste } from './classificarTeste.js';
import { etiquetasDoTeste } from './etiquetasDoTeste.js';
import { CasoTeste, limites } from '../tipos/catalogoDeTestes.js';

export function analisarArquivoFeature(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
  const linhas = texto.split(/\r?\n/); const casos: CasoTeste[] = []; let feature: string | null = null; let atual: CasoTeste | null = null; let tagsPend: string[] = []; const tagsFeature: string[] = [];
  linhas.forEach((l, i) => {
    const s = l.trim(); const tg = /^(@\S+\s*)+$/.test(s) ? etiquetasDoTeste(s) : null; if (tg) { tagsPend = tg; return; }
    const f = /^(?:Feature|Funcionalidade|Característica):\s*(.+)$/i.exec(s); if (f) { feature = f[1]!.slice(0, 120); tagsFeature.push(...tagsPend); tagsPend = []; return; }
    const sc = /^(?:Scenario(?: Outline)?|Cenário(?: de Fundo)?|Esquema do Cenário):\s*(.+)$/i.exec(s);
    if (sc && casos.length < limites.testesPorArquivo) { const tags = [...new Set([...tagsPend, ...tagsFeature])]; tagsPend = []; const c = classificarTeste(rel, texto, tags); atual = { titulo: sc[1]!.slice(0, 200), ...c, linha: i + 1, passos: [], tags }; casos.push(atual); return; }
    const st = /^(Given|When|Then|And|But|Dado|Quando|Então|Entao|E|Mas)\s+(.+)$/i.exec(s); if (st && atual && atual.passos.length < 30) atual.passos.push(`${st[1]} ${st[2]}`.slice(0, 160));
  });
  return { feature, casos };
}
