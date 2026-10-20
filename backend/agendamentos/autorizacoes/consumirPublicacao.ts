/** Gasta uma publicação da política antes de publicar. */
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { gravarAutorizacoes } from '../banco/autorizacoes.js';
import { lerAutorizacoes } from '../banco/autorizacoes.js';

/** Consome uma publicação da política que cobre ticket+tipo. Retorna null se nenhuma cobrir. */
export function consumirPublicacao(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.publicacoes.find(x => x.espacoId === espacoId && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.tickets.includes(ticket) && (x.tipos as string[]).includes(tipo));
  if (!p) return null; p.usadas += 1; gravarAutorizacoes(r, base); return p;
}
