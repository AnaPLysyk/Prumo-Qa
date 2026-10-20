/** Identifica arquivos, organiza catálogos e classifica casos de teste. */
import fs from "node:fs";
import path from "node:path";
import { anotarQase } from "./regras/anotarQase.js";
import { CasoTeste, Catalogo, FeatureTestes, IGNORAR, TipoTeste, limites, tiposDeTeste, Confianca, porTag } from "./tipos/catalogoDeTestes.js";

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

/** Classifica um teste. Ordem: tag explícita > caminho/nome > conteúdo do arquivo > padrão. */
export function classificarTeste(rel: string, conteudo: string, tags: string[]): { tipo: TipoTeste; confianca: Confianca; motivo: string } {
  for (const t of tags) if (porTag[t]) return { tipo: porTag[t]!, confianca: 'ALTA', motivo: `tag @${t}` };
  const caminho = rel.toLowerCase().replaceAll('\\', '/');
  const seg = (re: RegExp) => re.test(caminho);
  if (seg(/(^|\/)(smoke)(\/|[._-])/)) return { tipo: 'smoke', confianca: 'ALTA', motivo: 'caminho contém smoke' };
  if (seg(/(^|\/)(regress(ion|ao|ão)|regression)(\/|[._-])/)) return { tipo: 'regressao', confianca: 'ALTA', motivo: 'caminho contém regressão' };
  if (seg(/(^|\/)(perf|performance|load|stress|k6)(\/|[._-])/) || /from ['"]k6/.test(conteudo)) return { tipo: 'desempenho', confianca: /from ['"]k6/.test(conteudo) ? 'ALTA' : 'MEDIA', motivo: 'carga/desempenho (k6 ou caminho)' };
  if (seg(/(^|\/)(a11y|acessibilidade|accessibility)(\/|[._-])/) || /axe-core|@axe-core|AxeBuilder|checkA11y/.test(conteudo)) return { tipo: 'acessibilidade', confianca: 'MEDIA', motivo: 'axe ou caminho de acessibilidade' };
  if (seg(/(^|\/)(unit|unitarios?|unitario)(\/|[._-])/)) return { tipo: 'unitario', confianca: 'ALTA', motivo: 'caminho contém unit' };
  if (seg(/(^|\/)(integration|integracao|api|contract|contrato)(\/|[._-])/)) return { tipo: 'integracao', confianca: 'MEDIA', motivo: 'caminho de integração/API' };
  if (seg(/(^|\/)(e2e|functional|funcional|cypress|playwright|ui)(\/|[._-])/) || /\.feature$/.test(caminho)) return { tipo: 'funcional', confianca: 'MEDIA', motivo: 'caminho E2E/funcional ou arquivo .feature' };
  if (/@playwright\/test|from ['"]cypress|page\.goto\(|cy\.visit\(|browser\.url\(|webdriver/i.test(conteudo)) return { tipo: 'funcional', confianca: 'MEDIA', motivo: 'usa navegador (Playwright/Cypress)' };
  if (/supertest|request\(app\)|fetch\(['"`]https?:|axios\.(get|post)|APIRequestContext|requests\.(get|post)/.test(conteudo)) return { tipo: 'integracao', confianca: 'MEDIA', motivo: 'chama API/HTTP' };
  if (/\.(spec|test)\.[cm]?[jt]sx?$|\.py$/.test(caminho)) return { tipo: 'unitario', confianca: 'BAIXA', motivo: 'sem navegador nem HTTP: provável unitário' };
  return { tipo: 'indefinido', confianca: 'BAIXA', motivo: 'sem sinais suficientes' };
}

/** Reúne identificar arquivos de teste da funcionalidade, mantendo cada operação identificável pelo nome. */


/** Diz pelo nome se um arquivo é de teste (.spec, .test, .feature, test_*.py). */

export const pareceArquivoDeTeste = (n: string) => /\.(spec|test)\.[cm]?[jt]sx?$/i.test(n) || /\.feature$/i.test(n) || /^test_.*\.py$/i.test(n) || /_test\.py$/i.test(n);

/** Diz pelo caminho se um arquivo é um pipeline do GitHub Actions (.github/workflows/*.yml ou *.yaml, sem subpastas). */

export const pareceArquivoDePipeline = (rel: string) => /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/.test(rel);

/** Lê as etiquetas @tag de um trecho de teste (ex.: @smoke). */

export const etiquetasDoTeste = (texto: string) => [...new Set([...texto.matchAll(/@([a-z][a-z0-9_-]{1,24})/gi)].map(m => m[1]!.toLowerCase()))].slice(0, 8);

/** Conteúdo de um arquivo de teste listado pelo catálogo (somente leitura, dentro da pasta vinculada, até 300 KB). */
export function arquivoDeTeste(raiz: string, relativo: string): { arquivo: string; linhas: number; conteudo: string } {
  const rel = String(relativo).replaceAll('\\', '/');
  if (!rel || rel.length > 400 || rel.startsWith('/') || /^[a-z]:/i.test(rel) || rel.split('/').some((x) => x === '..' || x === '.' || IGNORAR.has(x)) || /[\x00-\x1f]/.test(rel) || (!pareceArquivoDeTeste(rel.split('/').at(-1)!) && !pareceArquivoDePipeline(rel))) throw new Error('TEST_FILE_INVALID');
  const base = fs.realpathSync(raiz); const alvo = fs.realpathSync(path.join(base, rel));
  if (alvo !== path.join(base, rel) && !alvo.startsWith(base + path.sep)) throw new Error('TEST_FILE_INVALID');
  const st = fs.lstatSync(path.join(base, rel)); if (st.isSymbolicLink() || !st.isFile() || st.size > limites.bytes) throw new Error('TEST_FILE_INVALID');
  const conteudo = fs.readFileSync(alvo, 'utf8'); return { arquivo: rel, linhas: conteudo.split(/\r?\n/).length, conteudo };
}
