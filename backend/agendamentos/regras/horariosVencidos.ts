/** Lista os horários da rotina que já venceram e diz quais ainda dá tempo de rodar e quais foram perdidos. */
import { horariosEntre } from './horariosEntre.js';
import { Rotina, SlotVencido } from '../tipos/rotina.js';

/**
 * Decide o que fazer com os slots vencidos desde o último tratado. Política:
 * - dentro da tolerância: executa;
 * - fora da tolerância e PULAR: registra PERDIDO (nunca executa "atrasado" sem decisão);
 * - EXECUTAR_UMA_VEZ: executa só o mais recente; os demais ficam SUBSTITUIDO.
 */
export function horariosVencidos(r: Rotina, agora: number): SlotVencido[] {
  if (r.estado !== 'ATIVA') return [];
  const base = r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora);
  const slots = horariosEntre(r, base, agora, 500); if (!slots.length) return [];
  const tolerancia = r.toleranciaMinutos * 60000; const ultimo = slots[slots.length - 1]!;
  return slots.map(slot => {
    const atrasado = agora - slot > tolerancia;
    if (r.politicaPerdido === 'EXECUTAR_UMA_VEZ') return slot === ultimo ? { slot, executar: true } : { slot, executar: false, motivo: 'SUBSTITUIDO' as const };
    return atrasado ? { slot, executar: false, motivo: 'PERDIDO' as const } : { slot, executar: true };
  });
}
