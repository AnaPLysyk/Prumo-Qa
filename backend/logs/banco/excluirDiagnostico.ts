/** Apaga o diagnóstico da janela, informando falhas. */
import fs from 'node:fs';
import path from 'node:path';
import { eAtalho } from '../../compartilhado/seguranca/eAtalho.js';
import { pastaDoDiagnostico } from './pastaDoDiagnostico.js';
import { nomeValido } from '../tipos/diagnostico.js';

/** Exclusão controlada: só arquivos ipc-AAAA-MM-DD.jsonl regulares, um a um; falhas parciais são devolvidas. */
export function excluirDiagnostico(base?: string) {
  const dir = pastaDoDiagnostico(base); const falhas: { file: string; code: string }[] = []; let apagados = 0;
  if (eAtalho(dir)) return { deleted: 0, failed: [{ file: 'diagnostico', code: 'SYMLINK_FORBIDDEN' }] };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)); } catch { return { deleted: 0, failed: falhas }; }
  for (const n of nomes) {
    const alvo = path.join(dir, n);
    try { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) throw Object.assign(new Error('x'), { code: 'FILE_INVALID' }); fs.unlinkSync(alvo); apagados++; }
    catch (e) { falhas.push({ file: n, code: (e as NodeJS.ErrnoException).code ?? 'UNKNOWN' }); }
  }
  try { fs.rmdirSync(dir); } catch { /* ainda há arquivos: permanece */ }
  return { deleted: apagados, failed: falhas };
}
