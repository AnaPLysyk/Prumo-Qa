/** Impressão digital de um conhecimento para não guardar o mesmo duas vezes. */
import { createHash } from 'node:crypto';

export function impressaoDoConhecimento(agente: string | null, espacoId: string | null, tipo: string, titulo: string, texto: string) { return createHash('sha256').update([agente ?? '*', espacoId ?? '*', tipo, titulo.trim().toLowerCase(), texto.trim().toLowerCase()].join('\0')).digest('hex'); }
