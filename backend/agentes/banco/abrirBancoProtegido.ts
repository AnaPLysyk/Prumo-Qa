/** Abre um banco SQLite da pasta de dados com proteção: pasta 0700, sem atalhos, um único arquivo comum e permissão 600. */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

/** `preparar` cria as tabelas; se falhar, o banco é fechado antes do erro subir. */
export function abrirBancoProtegido(alvo: string, falhar: () => never, preparar: (db: DatabaseSync) => void): DatabaseSync {
  fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 }); semLinks(alvo);
  if (fs.existsSync(alvo)) { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) falhar(); }
  const db = new DatabaseSync(alvo); try { preparar(db); } catch (e) { db.close(); throw e; }
  try { fs.chmodSync(alvo, 0o600); } catch { /* ACL herdada no Windows */ }
  return db;
}
