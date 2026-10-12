/** Barra a chamada da IA quando a capacidade está bloqueada (POLICY_BLOCKED). Vale no servidor MCP a cada chamada. */
import { capacidadeEfetiva } from './capacidadeEfetiva.js';

export function exigirCapacidade(espacoId: string | null, cap: string, b?: string) {
  const e = capacidadeEfetiva(espacoId, cap, b); if (e.estado === 'BLOQUEADO' || e.estado === 'SOMENTE_PESSOA') throw Object.assign(new Error(`POLICY_BLOCKED: ${e.motivo}`), { codigo: 'POLICY_BLOCKED' }); return e;
}
