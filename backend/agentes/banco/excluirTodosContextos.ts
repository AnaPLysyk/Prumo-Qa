/** Apaga todos os contextos do projeto (Ajuda › Privacidade e dados), informando falhas. */
import fs from 'node:fs';
import path from 'node:path';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { pastaContextos } from './arquivosDeContexto.js';

/** Exclui os contextos do projeto um a um; falhas parciais (arquivo em uso, permissão) são devolvidas, nunca escondidas. */
export function excluirTodosContextos(p: Projeto, base?: string) {
  const dir = pastaContextos(p, base); let n = 0; const failed: { file: string; code: string }[] = []; let nomes: string[] = [];
  try { nomes = fs.readdirSync(dir).filter(x => /^[0-9a-f-]{36}\.json$/.test(x)); } catch { return { deleted: 0, failed }; }
  for (const x of nomes) { try { const st = fs.lstatSync(path.join(dir, x)); if (!st.isFile() || st.nlink !== 1) throw Object.assign(new Error('x'), { code: 'FILE_INVALID' }); fs.unlinkSync(path.join(dir, x)); n++; } catch (e) { failed.push({ file: x, code: (e as NodeJS.ErrnoException).code ?? 'UNKNOWN' }); } }
  return { deleted: n, failed };
}
