/** Monta o caminho completo de um arquivo do projeto conferindo, pasta por pasta, que ele fica dentro da raiz e não passa por atalhos (links). */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ErroQa } from '../erros.js';
import { sensivel } from './sensivel.js';
import { validarRelativo } from './validarRelativo.js';

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
