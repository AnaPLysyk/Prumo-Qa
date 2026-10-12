/** Abre o banco de conhecimento (sem atalhos, um único arquivo). */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { caminhoConhecimento } from './caminhoConhecimento.js';
import { criarEsquemaDoConhecimento } from './criarEsquemaDoConhecimento.js';
import { falharConhecimento } from './falharConhecimento.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function abrirBancoDeConhecimento(base?: string) {
  const alvo = caminhoConhecimento(base); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 }); semLinks(alvo);
  if (fs.existsSync(alvo)) { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) falharConhecimento('KNOWLEDGE_FILE_INVALID'); }
  const db = new DatabaseSync(alvo); try { criarEsquemaDoConhecimento(db); } catch (e) { db.close(); throw e; }
  try { fs.chmodSync(alvo, 0o600); } catch { /* ACL herdada no Windows */ }
  return db;
}
