/** Devolve a publicação gasta quando o envio falhou. */
import { gravarAutorizacoes } from '../banco/gravarAutorizacoes.js';
import { lerAutorizacoes } from '../banco/lerAutorizacoes.js';

/** Devolve o uso quando a publicação falhou antes de chegar ao Jira (não houve efeito remoto). */
export function devolverPublicacao(id: string, base?: string) { const r = lerAutorizacoes(base); const p = r.publicacoes.find(x => x.id === id); if (p && p.usadas > 0) { p.usadas -= 1; gravarAutorizacoes(r, base); } }
