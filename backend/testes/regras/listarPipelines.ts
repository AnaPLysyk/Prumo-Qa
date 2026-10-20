/** Lista os pipelines (.github/workflows) da pasta do projeto, com nome, eventos e jobs lidos do próprio arquivo, sem executar nada. */
import fs from 'node:fs';
import path from 'node:path';
import { limites } from '../tipos/catalogoDeTestes.js';
import { pareceArquivoDePipeline } from '../servicoClassificacao.js';

type ResumoDePipeline = { arquivo: string; nome: string; eventos: string[]; jobs: string[]; linhas: number };

const MAX_PIPELINES = 50;

/** Leitura simples e conservadora do YAML: só `name:`, as chaves de `on:` e as chaves de `jobs:`. Não interpreta expressões. */
function resumirPipeline(arquivo: string, texto: string): ResumoDePipeline {
  const linhas = texto.split(/\r?\n/);
  const nome = /^name:\s*['"]?(.+?)['"]?\s*(#.*)?$/m.exec(texto)?.[1]?.slice(0, 120) ?? path.posix.basename(arquivo).replace(/\.ya?ml$/i, '');
  const bloco = (chave: string): string[] => {
    const i = linhas.findIndex((l) => new RegExp(`^["']?${chave}["']?:`).test(l)); if (i < 0) return [];
    const inline = /^["']?\w+["']?:\s*(.+)$/.exec(linhas[i]!)?.[1]?.replace(/#.*$/, '').trim();
    if (inline) return inline.replace(/[\[\]'"]/g, '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);
    const saida: string[] = [];
    for (const l of linhas.slice(i + 1)) {
      if (/^\S/.test(l) && !l.startsWith('#')) break;
      const m = /^ {2}["']?([A-Za-z0-9_.-]+)["']?:/.exec(l); if (m) saida.push(m[1]!);
    }
    return saida.slice(0, 30);
  };
  return { arquivo, nome, eventos: bloco('on'), jobs: bloco('jobs'), linhas: linhas.length };
}

export function listarPipelines(raiz: string): ResumoDePipeline[] {
  const base = fs.realpathSync(raiz); const pasta = path.join(base, '.github', 'workflows');
  if (!fs.existsSync(pasta)) return [];
  const st = fs.lstatSync(pasta); if (st.isSymbolicLink() || !st.isDirectory() || !fs.realpathSync(pasta).startsWith(base + path.sep)) return [];
  const saida: ResumoDePipeline[] = [];
  for (const it of fs.readdirSync(pasta, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = '.github/workflows/' + it.name; if (!it.isFile() || it.isSymbolicLink() || !pareceArquivoDePipeline(rel)) continue;
    const arq = path.join(pasta, it.name); if (fs.statSync(arq).size > limites.bytes) continue;
    saida.push(resumirPipeline(rel, fs.readFileSync(arq, 'utf8')));
    if (saida.length >= MAX_PIPELINES) break;
  }
  return saida;
}
