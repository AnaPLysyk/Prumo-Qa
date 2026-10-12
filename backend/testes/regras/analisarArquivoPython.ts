/** Encontra as funções test_ de um arquivo Python. */
import { classificarTeste } from './classificarTeste.js';
import { etiquetasDoTeste } from './etiquetasDoTeste.js';
import { CasoTeste, limites } from '../tipos/catalogoDeTestes.js';

export function analisarArquivoPython(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
  const casos: CasoTeste[] = []; const linhas = texto.split(/\r?\n/);
  linhas.forEach((l, i) => { const m = /^\s*(?:async\s+)?def\s+(test_\w+)\s*\(/.exec(l); if (m && casos.length < limites.testesPorArquivo) { const tags = etiquetasDoTeste(linhas.slice(Math.max(0, i - 2), i).join(' ')); const c = classificarTeste(rel, texto, tags); casos.push({ titulo: m[1]!.replaceAll('_', ' ').slice(5).trim() || m[1]!, ...c, linha: i + 1, passos: [], tags }); } });
  return { feature: null, casos };
}
