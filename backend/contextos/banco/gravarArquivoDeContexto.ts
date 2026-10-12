/** Grava um arquivo de contexto com segurança: cópia temporária e troca no final. */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function gravarArquivoDeContexto(alvo: string, dados: unknown) {
  semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(dados, null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo);
}
