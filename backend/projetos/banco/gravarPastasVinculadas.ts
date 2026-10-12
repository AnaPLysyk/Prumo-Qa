/** Grava a lista de pastas de projeto vinculadas (vinculos.json). */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { arquivoDePastasVinculadas } from './arquivoDePastasVinculadas.js';

export function gravarPastasVinculadas(projects: { root: string; addedAt: string }[], base?: string) {
  const alvo = arquivoDePastasVinculadas(base); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = alvo + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, projects }, null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo);
}
