/** Lê os registros dos testes de integração já feitos. */
import fs from 'node:fs';
import path from 'node:path';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { pastaDosTestesDeIntegracao } from './pastaDosTestesDeIntegracao.js';
import { Registro, registroSchema } from '../tipos/integracaoIa.js';

export function registrosIntegracao(p: Projeto) {
  const dir = pastaDosTestesDeIntegracao(p); semLinks(dir);
  if (!fs.existsSync(dir)) return { records: [] as Registro[], problems: 0 };
  const nomes = fs.readdirSync(dir).filter(n => /^[a-f0-9-]{36}\.json$/.test(n));
  if (nomes.length > 1000) throw new Error('INTEGRATION_LIMIT');
  const records: Registro[] = []; let problems = 0;
  for (const nome of nomes) {
    try {
      const arq = path.join(dir, nome); semLinks(arq); const st = fs.lstatSync(arq);
      if (!st.isFile() || st.nlink !== 1 || st.size > 8192) throw new Error('invalid');
      const raw = JSON.parse(fs.readFileSync(arq, 'utf8'));
      if (typeof raw.payload !== 'string' || hash(raw.payload) !== raw.sha256) throw new Error('invalid');
      const r = registroSchema.parse(JSON.parse(raw.payload));
      if (r.id + '.json' !== nome || r.rootHash !== hash(p.raiz) || r.projectHash !== hash(p.manifesto.id)) throw new Error('binding');
      records.push(r);
    } catch { problems++; }
  }
  return { records: records.sort((a, b) => a.at.localeCompare(b.at)), problems };
}
