/** Abre um trabalho da fila, aplica uma alteração, confere e grava. */
import { gravarFila } from './gravarFila.js';
import { lerFila } from './lerFila.js';
import { Trabalho, trabalhoSchema } from '../tipos/fila.js';

export function mudarTrabalho(id: string, fn: (t: Trabalho) => void, base?: string) { const r = lerFila(base); const t = r.trabalhos.find(x => x.id === id); if (!t) throw new Error('JOB_NOT_FOUND'); fn(t); trabalhoSchema.parse(t); gravarFila(r, base); return t; }
