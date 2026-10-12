/** Grava a trava do worker (worker-trava.json) com a identidade, o processo e o batimento atual, ligada ou desligada. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerTravaDoWorker } from '../banco/lerTravaDoWorker.js';
import { EstadoDoWorker, travaSchema } from '../tipos/worker.js';

export function gravarTravaDoWorker(e: EstadoDoWorker, ativo: boolean) {
  const agora = e.agora().toISOString(); const antigo = lerTravaDoWorker(e.base);
  gravarLocal('worker-trava.json', travaSchema.parse({ instancia: e.instancia, pid: process.pid, inicio: antigo?.instancia === e.instancia ? antigo.inicio : agora, batimento: agora, ativo }), e.base);
}
