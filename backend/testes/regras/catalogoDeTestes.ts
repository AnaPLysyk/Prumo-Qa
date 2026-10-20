/** Monta o catálogo de testes do projeto: arquivos agrupados por funcionalidade, cada teste classificado e contado por tipo. */
import fs from 'node:fs';
import path from 'node:path';
import { analisarArquivoFeature } from './analisarArquivoFeature.js';
import { analisarArquivoJs } from './analisarArquivoJs.js';
import { analisarArquivoPython } from './analisarArquivoPython.js';
import { anotarQase } from './anotarQase.js';
import { coletarArquivosDeTeste } from './coletarArquivosDeTeste.js';
import { Catalogo, FeatureTestes, TipoTeste, limites, tiposDeTeste } from '../tipos/catalogoDeTestes.js';

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
