/** Monta o catálogo de testes do projeto: arquivos agrupados por funcionalidade, cada teste classificado e contado por tipo. */
import fs from 'node:fs';
import path from 'node:path';

import { anotarQase } from './anotarQase.js';

import { CasoTeste, Catalogo, FeatureTestes, IGNORAR, TipoTeste, limites, tiposDeTeste } from '../tipos/catalogoDeTestes.js';
import { pareceArquivoDeTeste } from './identificarArquivosDeTeste.js';
import { classificarTeste } from './classificarTeste.js';
import { etiquetasDoTeste } from './identificarArquivosDeTeste.js';

function analisarArquivoFeature(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
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

function analisarArquivoJs(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
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

function analisarArquivoPython(rel: string, texto: string): { feature: string | null; casos: CasoTeste[] } {
  const casos: CasoTeste[] = []; const linhas = texto.split(/\r?\n/);
  linhas.forEach((l, i) => { const m = /^\s*(?:async\s+)?def\s+(test_\w+)\s*\(/.exec(l); if (m && casos.length < limites.testesPorArquivo) { const tags = etiquetasDoTeste(linhas.slice(Math.max(0, i - 2), i).join(' ')); const c = classificarTeste(rel, texto, tags); casos.push({ titulo: m[1]!.replaceAll('_', ' ').slice(5).trim() || m[1]!, ...c, linha: i + 1, passos: [], tags }); } });
  return { feature: null, casos };
}

function coletarArquivosDeTeste(raiz: string): { arquivos: string[]; truncado: boolean } {
  const achados: string[] = []; let truncado = false;
  const andar = (dir: string, nivel: number) => {
    if (truncado || nivel > limites.profundidade) return;
    let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of itens) {
      if (it.isSymbolicLink()) continue;
      const p = path.join(dir, it.name);
      if (it.isDirectory()) { if (!IGNORAR.has(it.name)) andar(p, nivel + 1); }
      else if (it.isFile() && pareceArquivoDeTeste(it.name)) { if (achados.length >= limites.arquivos) { truncado = true; return; } achados.push(p); }
    }
  };
  andar(raiz, 0); return { arquivos: achados.sort(), truncado };
}

/** Deduz o nome da funcionalidade a partir do caminho do arquivo de teste. */

const funcionalidadeDoArquivo = (rel: string) => { const p = rel.replaceAll('\\', '/').split('/'); const arq = p.at(-1)!.replace(/\.(spec|test)\.[cm]?[jt]sx?$|\.feature$|\.py$/i, '').replace(/^test_|_test$/g, ''); const pai = p.length > 1 ? p.at(-2)! : ''; return (['tests', 'test', 'e2e', 'spec', 'specs', '__tests__'].includes(pai.toLowerCase()) || !pai ? arq : pai + ' / ' + arq).replace(/[-_.]+/g, ' ').slice(0, 120); };

export function catalogoDeTestes(raiz: string): Catalogo {
  const { arquivos, truncado } = coletarArquivosDeTeste(raiz); const features: FeatureTestes[] = []; const porTipo = Object.fromEntries(tiposDeTeste.map(t => [t, 0])) as Record<TipoTeste, number>;
  for (const abs of arquivos) {
    const rel = path.relative(raiz, abs).replaceAll('\\', '/'); let texto: string;
    try { const st = fs.statSync(abs); if (st.size > limites.bytes) continue; texto = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    const r = /\.feature$/i.test(rel) ? analisarArquivoFeature(rel, texto) : /\.py$/i.test(rel) ? analisarArquivoPython(rel, texto) : analisarArquivoJs(rel, texto);
    if (!r.casos.length) continue;
    anotarQase(texto, r.casos);
    for (const c of r.casos) porTipo[c.tipo]++;
    features.push({ nome: r.feature ?? funcionalidadeDoArquivo(rel), arquivo: rel, tipos: [...new Set(r.casos.map(c => c.tipo))], testes: r.casos });
  }
  const testes = features.reduce((s, f) => s + f.testes.length, 0);
  return { raiz: path.basename(raiz), arquivos: features.length, testes, porTipo, features, truncado,
    aviso: 'Classificação inferida por tag, caminho e conteúdo; confira a confiança de cada teste. Nada foi executado: isto é a leitura estática do repositório.' };
}
