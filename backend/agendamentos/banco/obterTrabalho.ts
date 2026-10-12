/** Busca um trabalho da fila pelo id. */
import { lerFila } from './lerFila.js';

export function obterTrabalho(id: string, base?: string) { const t = lerFila(base).trabalhos.find(x => x.id === id); if (!t) throw new Error('JOB_NOT_FOUND'); return t; }
