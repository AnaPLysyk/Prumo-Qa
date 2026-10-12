/** Anota que um horário da rotina já foi tratado; rotina de execução única passa a concluída. */
import { alterarRotina } from '../banco/alterarRotina.js';
import { anotarNaRotina } from './anotarNaRotina.js';

/** Marca o slot tratado (executado, pulado ou perdido). Rotina única conclui. */
export function marcarHorarioTratado(id: string, slot: number, base?: string) {
  return alterarRotina(id, r => { r.ultimoSlot = new Date(Math.max(slot, r.ultimoSlot ? Date.parse(r.ultimoSlot) : 0)).toISOString(); if (r.frequencia.tipo === 'unico') { r.estado = 'CONCLUIDA'; anotarNaRotina(r, 'CONCLUIDA'); } }, base);
}
