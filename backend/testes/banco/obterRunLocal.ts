/** Busca uma run local pelo id. */
import { lerRunsLocais } from './lerRunsLocais.js';

export function obterRunLocal(id: string, b?: string) { const r = lerRunsLocais(b).itens.find(x => x.id === id); if (!r) throw new Error('RUN_NOT_FOUND'); return r; }
