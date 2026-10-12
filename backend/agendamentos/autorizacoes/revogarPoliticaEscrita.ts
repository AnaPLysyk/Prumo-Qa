/** Revoga uma política de escrita no Qase. */
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';

export function revogarPoliticaEscrita(id: string, base?: string, agora = new Date()) { const r = lerAutorizacoes(base); const a = r.escritas.find(x => x.id === id); if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravarAutorizacoes(r, base); return a; }
