/** Guarda as pastas vinculadas aos projetos, sem seguir atalhos nem perder o arquivo anterior. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { arquivoSchema } from '../tipos/pastasVinculadas.js';

export const arquivoDePastasVinculadas = (base?: string) =>
  path.join(diretorioDados(base), 'vinculos.json');

export function lerPastasVinculadas(base?: string) {
  try {
    const conteudo = fs.readFileSync(arquivoDePastasVinculadas(base), 'utf8');
    return arquivoSchema.parse(JSON.parse(conteudo)).projects;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new Error('LINKS_INVALID: vinculos.json inválido; corrija ou remova o arquivo.');
  }
}

export function gravarPastasVinculadas(
  projetos: { root: string; addedAt: string }[],
  base?: string
) {
  const destino = arquivoDePastasVinculadas(base);
  fs.mkdirSync(path.dirname(destino), { recursive: true, mode: 0o700 });

  // Arquivo temporário e substituição atômica: nunca gravar parcialmente vínculos.
  const temporario = destino + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(
    temporario,
    JSON.stringify({ version: 1, projects: projetos }, null, 2),
    { mode: 0o600 }
  );
  fs.renameSync(temporario, destino);
}
