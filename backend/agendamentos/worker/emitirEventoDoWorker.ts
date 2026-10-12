/** Avisa a janela de um acontecimento do worker, sem repetir o mesmo aviso por 30 minutos; um erro no aviso nunca derruba o worker. */
import { EstadoDoWorker, TipoEvento } from '../tipos/worker.js';

export function emitirEventoDoWorker(e: EstadoDoWorker, tipo: TipoEvento, rotinaId: string, trabalhoId: string, titulo: string, detalhe: string) {
  const chave = `${tipo}|${rotinaId}|${detalhe.slice(0, 40)}`; const t = e.agora().getTime(); const ultimo = e.emitidos.get(chave);
  if (ultimo !== undefined && t - ultimo < 30 * 60000 && tipo !== 'AGENDAMENTO_INICIADO') return; // não repete o mesmo aviso a cada tentativa
  e.emitidos.set(chave, t); if (e.emitidos.size > 200) e.emitidos.delete(e.emitidos.keys().next().value!);
  try { e.d.aoEvento?.({ tipo, rotinaId, trabalhoId, titulo, detalhe, at: e.agora().toISOString() }); } catch { /* notificação nunca derruba o worker */ }
}
