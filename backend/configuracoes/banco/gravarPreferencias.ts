/** Grava as preferências da pessoa com segurança (cópia temporária e troca). */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { arquivoDePreferencias } from './arquivoDePreferencias.js';
import { Preferencias, preferenciasSchema } from '../tipos/configuracoes.js';

export function gravarPreferencias(p: Preferencias, base?: string) {
  const alvo = arquivoDePreferencias(base); semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(preferenciasSchema.parse(p), null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo); return p;
}
