/** Busca a política vigente que cobre este ticket e este tipo de rotina. */
import { estadoDaAutorizacao } from './estadoDaAutorizacao.js';
import { lerAutorizacoes } from '../banco/autorizacoes.js';

/** Verifica (sem consumir) se a política cobre ticket e tipo. */
export function politicaCobre(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  return lerAutorizacoes(base).publicacoes.find(p => p.espacoId === espacoId && estadoDaAutorizacao(p, agora) === 'VIGENTE' && p.tickets.includes(ticket) && (p.tipos as string[]).includes(tipo)) ?? null;
}
