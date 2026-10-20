/** Operações de ciclo de vida das rotinas: pausa, retomada, conclusão e exclusão. */
import { alterarRotina, gravarAgenda, lerAgenda } from '../banco/agenda.js';
import { anotarNaRotina } from './cicloDaRotina.js';

export function definirPausaGlobal(pausado: boolean, base?: string) {
  const agenda = lerAgenda(base);
  agenda.pausaGlobal = pausado;
  gravarAgenda(agenda, base);
  return pausado;
}

export const desativarRotina = (id: string, base?: string) =>
  alterarRotina(id, rotina => {
    rotina.estado = 'DESATIVADA';
    anotarNaRotina(rotina, 'DESATIVADA');
  }, base);

export function excluirRotina(id: string, base?: string) {
  const agenda = lerAgenda(base);
  if (!agenda.rotinas.some(rotina => rotina.id === id)) {
    throw new Error('SCHEDULE_NOT_FOUND');
  }
  agenda.rotinas = agenda.rotinas.filter(rotina => rotina.id !== id);
  gravarAgenda(agenda, base);
  return { excluida: true };
}

/** Marca o horário tratado; uma rotina única passa ao estado concluída. */
export function marcarHorarioTratado(id: string, slot: number, base?: string) {
  return alterarRotina(id, rotina => {
    const anterior = rotina.ultimoSlot ? Date.parse(rotina.ultimoSlot) : 0;
    rotina.ultimoSlot = new Date(Math.max(slot, anterior)).toISOString();
    if (rotina.frequencia.tipo === 'unico') {
      rotina.estado = 'CONCLUIDA';
      anotarNaRotina(rotina, 'CONCLUIDA');
    }
  }, base);
}

export const pausarRotina = (id: string, base?: string) =>
  alterarRotina(id, rotina => {
    if (rotina.estado === 'ATIVA') {
      rotina.estado = 'PAUSADA';
      anotarNaRotina(rotina, 'PAUSADA');
    }
  }, base);

export const retomarRotina = (id: string, base?: string, agora = new Date()) =>
  alterarRotina(id, rotina => {
    if (rotina.estado === 'PAUSADA' || rotina.estado === 'DESATIVADA') {
      rotina.estado = 'ATIVA';
      rotina.ultimoSlot = agora.toISOString();
      anotarNaRotina(rotina, 'RETOMADA');
    }
  }, base);
