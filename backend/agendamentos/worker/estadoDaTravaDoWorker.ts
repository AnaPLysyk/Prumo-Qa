/** Diz se outro worker está vivo (trava ativa com batimento recente). */
import { lerTravaDoWorker } from '../banco/lerTravaDoWorker.js';
import { processoVivo } from './processoVivo.js';

export function estadoDaTravaDoWorker(b?: string, agora = new Date()) {
  const t = lerTravaDoWorker(b); if (!t || !t.ativo) return { vivo: false, pid: null as number | null, ultimoBatimento: t?.batimento ?? null };
  const fresco = agora.getTime() - Date.parse(t.batimento) < 60000 && processoVivo(t.pid);
  return { vivo: fresco, pid: t.pid, ultimoBatimento: t.batimento };
}
