/** Abre uma run local, aplica uma alteração, confere e grava. */
import { gravarRunsLocais } from './gravarRunsLocais.js';
import { lerRunsLocais } from './lerRunsLocais.js';
import { RunLocal, runSchema } from '../tipos/runLocal.js';

export function alterarRunLocal(id: string, fn: (r: RunLocal) => void, b?: string, agora = new Date()) { const reg = lerRunsLocais(b); const r = reg.itens.find(x => x.id === id); if (!r) throw new Error('RUN_NOT_FOUND'); fn(r); r.atualizadaEm = agora.toISOString(); runSchema.parse(r); gravarRunsLocais(reg, b); return r; }
