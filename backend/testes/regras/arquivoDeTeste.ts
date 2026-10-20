/** Lê um arquivo de teste (ou pipeline do GitHub Actions) para a IDE, só dentro da pasta do projeto. */
import fs from 'node:fs';
import path from 'node:path';
import { pareceArquivoDePipeline } from './identificarArquivosDeTeste.js';
import { pareceArquivoDeTeste } from './identificarArquivosDeTeste.js';
import { IGNORAR, limites } from '../tipos/catalogoDeTestes.js';

/** Conteúdo de um arquivo de teste listado pelo catálogo (somente leitura, dentro da pasta vinculada, até 300 KB). */
export function arquivoDeTeste(raiz: string, relativo: string): { arquivo: string; linhas: number; conteudo: string } {
  const rel = String(relativo).replaceAll('\\', '/');
  if (!rel || rel.length > 400 || rel.startsWith('/') || /^[a-z]:/i.test(rel) || rel.split('/').some((x) => x === '..' || x === '.' || IGNORAR.has(x)) || /[\x00-\x1f]/.test(rel) || (!pareceArquivoDeTeste(rel.split('/').at(-1)!) && !pareceArquivoDePipeline(rel))) throw new Error('TEST_FILE_INVALID');
  const base = fs.realpathSync(raiz); const alvo = fs.realpathSync(path.join(base, rel));
  if (alvo !== path.join(base, rel) && !alvo.startsWith(base + path.sep)) throw new Error('TEST_FILE_INVALID');
  const st = fs.lstatSync(path.join(base, rel)); if (st.isSymbolicLink() || !st.isFile() || st.size > limites.bytes) throw new Error('TEST_FILE_INVALID');
  const conteudo = fs.readFileSync(alvo, 'utf8'); return { arquivo: rel, linhas: conteudo.split(/\r?\n/).length, conteudo };
}
