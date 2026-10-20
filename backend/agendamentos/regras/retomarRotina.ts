/** Retoma uma rotina sem executar os horários que passaram durante a pausa. */
import { alterarRotina } from '../banco/agenda.js';
import { anotarNaRotina } from './anotarNaRotina.js';

export const retomarRotina = (id: string, base?: string, agora = new Date()) => alterarRotina(id, r => { if (r.estado === 'PAUSADA' || r.estado === 'DESATIVADA') { r.estado = 'ATIVA'; r.ultimoSlot = agora.toISOString(); anotarNaRotina(r, 'RETOMADA'); } }, base);
