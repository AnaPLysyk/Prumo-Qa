/** Revoga uma política de publicação no Jira. */
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';

export function revogarPublicacao(id: string, base?: string, agora = new Date()) { const r = lerAutorizacoes(base); const a = r.publicacoes.find(x => x.id === id); if (!a) throw new Error('AUTH_NOT_FOUND'); a.revogadaEm ??= agora.toISOString(); gravarAutorizacoes(r, base); return a; }
