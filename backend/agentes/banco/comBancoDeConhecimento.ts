/** Abre o banco de conhecimento (conhecimento.db), garante as tabelas, faz a operação e fecha sempre. */
import { DatabaseSync } from 'node:sqlite';
import { abrirBancoProtegido } from './abrirBancoProtegido.js';
import { caminhoConhecimento } from './baseDoConhecimento.js';
import { criarEsquemaDoConhecimento } from './criarEsquemaDoConhecimento.js';
import { falharConhecimento } from './baseDoConhecimento.js';

export function comBancoDeConhecimento<T>(base: string | undefined, fn: (db: DatabaseSync) => T): T {
  const db = abrirBancoProtegido(caminhoConhecimento(base), () => falharConhecimento('KNOWLEDGE_FILE_INVALID'), criarEsquemaDoConhecimento);
  try { return fn(db); } finally { db.close(); }
}
