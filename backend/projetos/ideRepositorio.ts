/** IDE do projeto: explorador e edição de textos do repositório local vinculado, sem executar ou publicar código. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash } from '../compartilhado/seguranca/hash.js';
import { mascarar } from '../compartilhado/seguranca/mascarar.js';
import { IGNORAR } from '../testes/tipos/catalogoDeTestes.js';

const MAX_ARQUIVOS = 8000;
const MAX_PROFUNDIDADE = 24;
const MAX_BYTES = 300_000;
const bloqueado = (nome: string) => IGNORAR.has(nome.toLowerCase()) || ['.idea', '.vscode-test', '.gitmodules'].includes(nome.toLowerCase());
const segredo = (nome: string) => /^(?:\.env(?:\..+)?|id_(?:rsa|ed25519|ecdsa)|.*\.(?:pem|p12|pfx|key|asc)|credentials(?:\..*)?|secrets?(?:\..*)?)$/i.test(nome);

export type NoDoRepositorio = { nome: string; arquivo: string; tipo: 'pasta' | 'arquivo'; filhos?: NoDoRepositorio[] };

function raizReal(raiz: string): string {
  const r = fs.realpathSync(raiz);
  if (!fs.statSync(r).isDirectory()) throw new Error('IDE_SEM_REPOSITORIO');
  return r;
}
function caminhoSeguro(raiz: string, relativo: string): string {
  const rel = String(relativo).replaceAll('\\', '/');
  const partes = rel.split('/');
  if (!rel || rel.length > 400 || rel.startsWith('/') || /^[a-z]:/i.test(rel) || /[\u0000-\u001f]/.test(rel)
    || partes.some(p => !p || p === '.' || p === '..' || bloqueado(p) || segredo(p) || /[<>:"|?*]/.test(p) || /[. ]$/.test(p) || /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(p))) throw new Error('IDE_CAMINHO_INVALIDO');
  const base = raizReal(raiz);
  let atual = base;
  for (const p of partes) {
    atual = path.join(atual, p);
    if (fs.existsSync(atual)) {
      const st = fs.lstatSync(atual);
      if (st.isSymbolicLink()) throw new Error('IDE_ATALHO_RECUSADO');
      if (!fs.realpathSync(atual).toLowerCase().startsWith((base + path.sep).toLowerCase())) throw new Error('IDE_FORA_DO_REPOSITORIO');
    }
  }
  return atual;
}
function conteudoOriginal(alvo: string): string {
  const st = fs.lstatSync(alvo);
  if (!st.isFile() || st.isSymbolicLink() || st.size > MAX_BYTES) throw new Error('IDE_ARQUIVO_INDISPONIVEL');
  const bytes = fs.readFileSync(alvo);
  if (bytes.includes(0)) throw new Error('IDE_ARQUIVO_BINARIO');
  const texto = bytes.toString('utf8');
  if (!Buffer.from(texto, 'utf8').equals(bytes)) throw new Error('IDE_ARQUIVO_BINARIO');
  return texto;
}

/** Explora pastas de código, arquivos comuns e diretórios vazios. Artefatos gerados, segredos e atalhos são ignorados. */
export function arvoreDoRepositorio(raiz: string) {
  const base = raizReal(raiz);
  let quantidade = 0, truncado = false, ignorados = 0;
  const visitar = (dir: string, relativo: string, nivel: number): NoDoRepositorio[] => {
    if (nivel > MAX_PROFUNDIDADE) { truncado = true; return []; }
    let entradas: fs.Dirent[];
    try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { ignorados++; return []; }
    const saida: NoDoRepositorio[] = [];
    entradas.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name, 'pt-BR'));
    for (const entrada of entradas) {
      if (quantidade >= MAX_ARQUIVOS) { truncado = true; break; }
      if (entrada.isSymbolicLink() || bloqueado(entrada.name) || segredo(entrada.name)) { ignorados++; continue; }
      const nome = entrada.name, arquivo = relativo ? relativo + '/' + nome : nome;
      const absoluto = path.join(dir, nome);
      if (entrada.isDirectory()) {
        // Nunca seguir pontos de montagem/reparse points para fora do projeto.
        let real: string;
        try { real = fs.realpathSync(absoluto); } catch { ignorados++; continue; }
        if (!real.toLowerCase().startsWith((base + path.sep).toLowerCase())) { ignorados++; continue; }
        quantidade++;
        saida.push({ nome, arquivo, tipo: 'pasta', filhos: visitar(absoluto, arquivo, nivel + 1) });
      } else if (entrada.isFile()) {
        quantidade++;
        saida.push({ nome, arquivo, tipo: 'arquivo' });
      }
    }
    return saida;
  };
  return { arvore: visitar(base, '', 0), quantidade, truncado, ignorados, pasta: path.basename(base) };
}

export function lerArquivoDoRepositorio(raiz: string, arquivo: string) {
  const alvo = caminhoSeguro(raiz, arquivo);
  const original = conteudoOriginal(alvo);
  const conteudo = mascarar(original);
  return { arquivo, conteudo, hash: hash(original), linhas: original.split(/\r?\n/).length, editavel: conteudo === original };
}

/** Salva apenas texto com confirmação feita pelo controlador, SHA de concorrência e troca atômica. */
export function gravarArquivoDoRepositorio(raiz: string, arquivo: string, conteudo: string, hashBase: string | null) {
  if (Buffer.byteLength(conteudo, 'utf8') > MAX_BYTES || conteudo.includes('\u0000')) throw new Error('IDE_CONTEUDO_INVALIDO');
  const alvo = caminhoSeguro(raiz, arquivo);
  const base = raizReal(raiz);
  const pasta = path.dirname(alvo);
  let original: string | null = null;
  if (fs.existsSync(alvo)) {
    original = conteudoOriginal(alvo);
    if (mascarar(original) !== original) throw new Error('IDE_SEGREDO_PROTEGIDO');
    if (hashBase === null) throw new Error('IDE_ARQUIVO_EXISTENTE');
    if (hash(original) !== hashBase) throw new Error('IDE_ARQUIVO_ALTERADO');
  } else if (hashBase !== null) throw new Error('IDE_ARQUIVO_ALTERADO');
  let atual = base;
  for (const parte of path.relative(base, pasta).split(path.sep).filter(Boolean)) {
    atual = path.join(atual, parte);
    if (!fs.existsSync(atual)) break;
    if (fs.lstatSync(atual).isSymbolicLink()) throw new Error('IDE_ATALHO_RECUSADO');
  }
  fs.mkdirSync(pasta, { recursive: true });
  if (!fs.realpathSync(pasta).toLowerCase().startsWith((base + path.sep).toLowerCase()) && fs.realpathSync(pasta).toLowerCase() !== base.toLowerCase()) throw new Error('IDE_FORA_DO_REPOSITORIO');
  const texto = original && /\r\n/.test(original) && !/(^|[^\r])\n/.test(original) ? conteudo.replace(/\r?\n/g, '\r\n') : conteudo;
  const temporario = path.join(pasta, '.' + path.basename(alvo) + '.prumo-' + randomUUID() + '.tmp');
  try { fs.writeFileSync(temporario, texto, { encoding: 'utf8', flag: 'wx' }); if (original !== null) fs.chmodSync(temporario, fs.statSync(alvo).mode); fs.renameSync(temporario, alvo); }
  finally { fs.rmSync(temporario, { force: true }); }
  return { arquivo, linhas: texto.split(/\r?\n/).length, hash: hash(texto), criado: original === null };
}
