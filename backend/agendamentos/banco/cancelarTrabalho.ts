/** Cancela um trabalho que ainda não começou. */
import { mudarTrabalho } from './mudarTrabalho.js';

export const cancelarTrabalho = (id: string, base?: string, agora = new Date()) => mudarTrabalho(id, t => { if (t.estado !== 'PENDENTE') throw new Error('JOB_NOT_CANCELABLE'); t.estado = 'CANCELADO'; t.terminadoEm = agora.toISOString(); t.resultado = { status: 'NOT_RUN', motivo: 'Cancelado pela pessoa antes de iniciar.' }; }, base);
