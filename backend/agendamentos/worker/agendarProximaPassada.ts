/** Marca a próxima passada do worker daqui a alguns milissegundos; erro numa passada fica anotado e a seguinte é agendada mesmo assim. */
import { EstadoDoWorker } from '../tipos/worker.js';
import { passadaDoWorker } from './passadaDoWorker.js';

export function agendarProximaPassada(e: EstadoDoWorker, ms: number) {
  if (!e.ativo || e.d.semTemporizador) return;
  e.temporizador = setTimeout(() => {
    e.atual = passadaDoWorker(e).catch(erro => { e.ultimoErro = (erro as Error).message.slice(0, 120); }).finally(() => agendarProximaPassada(e, e.intervalo));
  }, ms);
  e.temporizador.unref?.();
}
