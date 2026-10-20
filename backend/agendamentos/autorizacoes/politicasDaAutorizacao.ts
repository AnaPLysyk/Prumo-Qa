/** Reúne politicas da autorizacao da funcionalidade, mantendo cada operação identificável pelo nome. */
import { estadoDaAutorizacao } from "./estadoDaAutorizacao.js";
import { gravarAutorizacoes, lerAutorizacoes } from "../banco/autorizacoes.js";
import { MAX_VALIDADE_DIAS } from "../tipos/autorizacoes.js";

/** Consome um uso se existir política vigente que cubra a operação e a run. Sem política: null (a operação agendada fica BLOQUEADA). */
export function consumirPoliticaEscrita(espacoId: string, operacao: string, run: number, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.escritas.find(x => x.espacoId === espacoId && x.operacao === operacao && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.runs.includes(run)); if (!p) return null; p.usos += 1; gravarAutorizacoes(r, base); return p;
}

/** Consome uma publicação da política que cobre ticket+tipo. Retorna null se nenhuma cobrir. */
export function consumirPublicacao(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.publicacoes.find(x => x.espacoId === espacoId && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.tickets.includes(ticket) && (x.tipos as string[]).includes(tipo));
  if (!p) return null; p.usadas += 1; gravarAutorizacoes(r, base); return p;
}

/** Verifica (sem consumir) se a política cobre ticket e tipo. */
export function politicaCobre(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  return lerAutorizacoes(base).publicacoes.find(p => p.espacoId === espacoId && estadoDaAutorizacao(p, agora) === 'VIGENTE' && p.tickets.includes(ticket) && (p.tipos as string[]).includes(tipo)) ?? null;
}

export const validadeDaAutorizacao = (dias: number, agora: Date) => { if (!Number.isFinite(dias) || dias <= 0 || dias > MAX_VALIDADE_DIAS) throw new Error('AUTH_VALIDITY_INVALID'); return new Date(agora.getTime() + dias * 86400000).toISOString(); };
