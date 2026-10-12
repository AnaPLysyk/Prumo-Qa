/** Lê e grava as preferências locais de forma atômica no computador. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { diretorioDados, semLinks } from '../../atividades.js';
import { preferenciasSchema, padrao, type Preferencias } from './definirPreferencias.js';

const arquivo = (base?: string) => path.join(diretorioDados(base), 'preferencias.json');
export function lerPreferencias(base?: string): Preferencias {
  try { semLinks(arquivo(base)); return preferenciasSchema.parse(JSON.parse(fs.readFileSync(arquivo(base), 'utf8'))); } catch { return { ...padrao }; }
}
export function gravar(p: Preferencias, base?: string) {
  const alvo = arquivo(base); semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(preferenciasSchema.parse(p), null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo); return p;
}
