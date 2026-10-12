/** Desliga o worker com cuidado: interrompe o teste em execução (e seus processos filhos), espera o registro e libera a trava. */
import { EstadoDoWorker } from '../tipos/worker.js';
import { gravarTravaDoWorker } from './gravarTravaDoWorker.js';

export async function pararWorker(e: EstadoDoWorker, esperaMs = 15000) {
  if (!e.ativo) return; e.ativo = false; if (e.temporizador) clearTimeout(e.temporizador); e.abort.abort();
  if (e.atual) await Promise.race([e.atual.catch(() => { /* já registrado */ }), new Promise(r => setTimeout(r, esperaMs).unref())]);
  gravarTravaDoWorker(e, false);
}
