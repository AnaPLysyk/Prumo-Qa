/** Abre o banco, faz a operação e fecha sempre. */
import { DatabaseSync } from 'node:sqlite';
import { abrirBancoDeConhecimento } from './abrirBancoDeConhecimento.js';

export function comBancoDeConhecimento<T>(base: string | undefined, fn: (db: DatabaseSync) => T): T { const db = abrirBancoDeConhecimento(base); try { return fn(db); } finally { db.close(); } }
