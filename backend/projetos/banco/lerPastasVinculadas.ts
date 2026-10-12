/** Lê a lista de pastas de projeto vinculadas (vinculos.json). */
import fs from 'node:fs';
import { arquivoDePastasVinculadas } from './arquivoDePastasVinculadas.js';
import { arquivoSchema } from '../tipos/pastasVinculadas.js';

export function lerPastasVinculadas(base?: string) {
  try { return arquivoSchema.parse(JSON.parse(fs.readFileSync(arquivoDePastasVinculadas(base), 'utf8'))).projects; }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw new Error('LINKS_INVALID: vinculos.json inválido; corrija ou remova o arquivo.'); }
}
