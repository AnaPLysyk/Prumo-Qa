/** Mede quanto espaço uma pasta de dados ocupa (com limite de arquivos). */
import fs from 'node:fs';
import path from 'node:path';

export function medirPasta(dir: string, limite = { n: 0 }): { bytes: number; arquivos: number; truncado: boolean } {
  let bytes = 0, arquivos = 0, truncado = false;
  let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { bytes, arquivos, truncado }; }
  for (const i of itens) {
    if (++limite.n > 50000) return { bytes, arquivos, truncado: true };
    const alvo = path.join(dir, i.name);
    if (i.isSymbolicLink()) continue;
    if (i.isDirectory()) { const r = medirPasta(alvo, limite); bytes += r.bytes; arquivos += r.arquivos; truncado ||= r.truncado; }
    else if (i.isFile()) { try { bytes += fs.statSync(alvo).size; arquivos++; } catch { /* arquivo sumiu: ignora */ } }
  }
  return { bytes, arquivos, truncado };
}
