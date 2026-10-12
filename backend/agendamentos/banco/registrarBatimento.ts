/** Anota que o trabalho em execução continua vivo (batimento). */
import { mudarTrabalho } from './mudarTrabalho.js';

export const registrarBatimento = (id: string, base?: string, agora = new Date()) => mudarTrabalho(id, t => { if (t.estado === 'EXECUTANDO') t.heartbeat = agora.toISOString(); }, base);
