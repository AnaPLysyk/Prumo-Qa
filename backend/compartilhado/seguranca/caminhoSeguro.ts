/** caminhoSeguro: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { negados } from "../projeto/contratos.js";
import path from "node:path";
import { ErroQa } from "../erros.js";
import { promises as fs } from "node:fs";

// --- caminhoSeguro ---
// --- sensivel ---
export function sensivel(p: string) { return p.split(/[\\/]/).some(v => negados.test(v) || /\.(?:pem|key|pfx|p12|crt|sqlite|db)$/i.test(v)); }

// --- caminhoSeguro ---
// ── validarRelativo ──
export function validarRelativo(p: string) {
  if (path.isAbsolute(p) || /^[a-z]:/i.test(p) || p.startsWith('\\') || p.split(/[\\/]/).includes('..') || /[:\x00-\x1f]/.test(p))
    throw new ErroQa('PATH_FORBIDDEN', 'Caminho deve ser relativo e permanecer na raiz.');
}

// ── caminhoSeguro ──
export async function caminhoSeguro(raiz: string, relativo: string, interno = false, novo = false): Promise<string> {
  validarRelativo(relativo);
  if (!interno && sensivel(relativo)) throw new ErroQa('SECRET_FORBIDDEN', 'Arquivo sensível ou diretório excluído.');
  const alvo = path.resolve(raiz, relativo);
  const rel = path.relative(raiz, alvo);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new ErroQa('PATH_FORBIDDEN', 'Fora da raiz.');
  let atual = raiz;
  for (const parte of rel.split(path.sep).filter(Boolean)) {
    atual = path.join(atual, parte);
    try {
      const st = await fs.lstat(atual);
      if (st.isSymbolicLink()) throw new ErroQa('SYMLINK_FORBIDDEN', 'Links simbólicos/junctions não são autorizados.');
      const real = await fs.realpath(atual);
      const realRel = path.relative(raiz, real);
      if (realRel.startsWith('..') || path.isAbsolute(realRel)) throw new ErroQa('PATH_FORBIDDEN', 'Caminho real fora da raiz.');
    } catch (e) { if (novo && (e as NodeJS.ErrnoException).code === 'ENOENT') break; throw e; }
  }
  return alvo;
}

// --- lerSeguro ---
export async function lerSeguro(raiz: string, relativo: string, interno = false, limite = 262144) {
  const alvo = await caminhoSeguro(raiz, relativo, interno);
  const st = await fs.stat(alvo);
  if (!st.isFile() || st.size > limite) throw new ErroQa('READ_LIMIT', 'Arquivo não regular ou maior que o limite de leitura.');
  const b = await fs.readFile(alvo);
  if (b.length > limite) throw new ErroQa('READ_LIMIT', 'Limite de leitura excedido.');
  if (b.includes(0)) throw new ErroQa('BINARY_FILE', 'Arquivo binário não será interpretado.');
  return b.toString('utf8');
}
