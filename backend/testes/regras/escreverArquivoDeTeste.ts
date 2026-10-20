/** Arquivos de testes e pipelines da IDE — arquivos relacionados agrupados para manutenção. */
import fs from "node:fs";
import path from "node:path";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { pareceArquivoDePipeline, pareceArquivoDeTeste } from "../servicoClassificacao.js";
import { IGNORAR, limites } from "../tipos/catalogoDeTestes.js";

// ── escreverArquivoDeTeste ──
type ResultadoDaEscrita = { arquivo: string; linhas: number; hash: string; criado: boolean };

function caminhoRelativo(relativo: string): string {
  const rel = String(relativo).replaceAll('\\', '/');
  if (!rel || rel.length > 400 || rel.startsWith('/') || /^[a-z]:/i.test(rel) || /[\x00-\x1f]/.test(rel)
    || rel.split('/').some((x) => x === '..' || x === '.' || x === '' || IGNORAR.has(x)) || (!pareceArquivoDeTeste(rel.split('/').at(-1)!) && !pareceArquivoDePipeline(rel))) throw new Error('TEST_FILE_INVALID: caminho ou nome de arquivo de teste ou de pipeline inválido.');
  return rel;
}

/** O fim de linha do arquivo existente é preservado: o editor trabalha com \n e o arquivo pode ser CRLF. */
const comFimDeLinha = (texto: string, original: string | null) => (original && /\r\n/.test(original) && !/(^|[^\r])\n/.test(original) ? texto.replace(/\r?\n/g, '\r\n') : texto);

/** `hashBase` é o SHA-256 do conteúdo lido antes de editar (null para arquivo novo). Arquivo novo não sobrescreve outro; arquivo alterado por fora não é sobrescrito. */
export function escreverArquivoDeTeste(raiz: string, relativo: string, conteudo: string, hashBase: string | null): ResultadoDaEscrita {
  const rel = caminhoRelativo(relativo);
  if (Buffer.byteLength(conteudo, 'utf8') > limites.bytes || conteudo.includes('\u0000')) throw new Error('TEST_FILE_INVALID: o conteúdo é grande demais ou não é texto.');
  const base = fs.realpathSync(raiz); const alvo = path.join(base, ...rel.split('/'));
  const pasta = path.dirname(alvo);
  // Cada pasta do caminho que já existe precisa ser pasta de verdade (nunca atalho) dentro da pasta do projeto.
  let atual = base;
  for (const parte of path.relative(base, pasta).split(path.sep).filter(Boolean)) {
    atual = path.join(atual, parte);
    if (!fs.existsSync(atual)) break;
    const st = fs.lstatSync(atual); if (st.isSymbolicLink() || !st.isDirectory() || !fs.realpathSync(atual).startsWith(base + path.sep)) throw new Error('TEST_FILE_INVALID: pasta fora do projeto ou atalho.');
  }
  let original: string | null = null;
  if (fs.existsSync(alvo)) {
    const st = fs.lstatSync(alvo); if (st.isSymbolicLink() || !st.isFile() || st.size > limites.bytes) throw new Error('TEST_FILE_INVALID: o arquivo não pode ser gravado.');
    if (fs.realpathSync(alvo) !== alvo && !fs.realpathSync(alvo).startsWith(base + path.sep)) throw new Error('TEST_FILE_INVALID: arquivo fora do projeto.');
    original = fs.readFileSync(alvo, 'utf8');
    if (hashBase === null) throw new Error('TEST_FILE_EXISTS: já existe um arquivo com esse caminho; abra-o para editar.');
    if (hash(original) !== hashBase) throw new Error('TEST_FILE_CHANGED: o arquivo mudou fora do Prumo depois de aberto; abra-o de novo antes de salvar.');
  } else if (hashBase !== null) throw new Error('TEST_FILE_CHANGED: o arquivo não existe mais; abra o catálogo de novo.');
  const texto = comFimDeLinha(conteudo, original);
  fs.mkdirSync(pasta, { recursive: true });
  if (!fs.realpathSync(pasta).startsWith(base + path.sep) && fs.realpathSync(pasta) !== base) throw new Error('TEST_FILE_INVALID: pasta fora do projeto.');
  const temporario = path.join(pasta, '.' + path.basename(alvo) + '.prumo-tmp');
  try { fs.writeFileSync(temporario, texto, { encoding: 'utf8', flag: 'w' }); fs.renameSync(temporario, alvo); } finally { fs.rmSync(temporario, { force: true }); }
  return { arquivo: rel, linhas: texto.split(/\r?\n/).length, hash: hash(texto), criado: original === null };
}

// ── listarPipelines ──
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
