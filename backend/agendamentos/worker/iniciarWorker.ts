/** Liga o worker: assume a trava de instância única (ou recusa se outro estiver vivo), recupera execuções interrompidas e agenda a primeira passada. */
import { lerTravaDoWorker } from './travaDoWorker.js';
import { recuperarInterrompidos } from '../banco/fila.js';
import { EstadoDoWorker } from '../tipos/worker.js';

import { emitirEventoDoWorker } from './apoioDoWorker.js';
import { gravarTravaDoWorker } from './travaDoWorker.js';
import { processoVivo } from './travaDoWorker.js';
import { passadaDoWorker } from './passadaDoWorker.js';

function agendarProximaPassada(e: EstadoDoWorker, ms: number) {
  if (!e.ativo || e.d.semTemporizador) return;
  e.temporizador = setTimeout(() => {
    e.atual = passadaDoWorker(e).catch(erro => { e.ultimoErro = (erro as Error).message.slice(0, 120); }).finally(() => agendarProximaPassada(e, e.intervalo));
  }, ms);
  e.temporizador.unref?.();
}


/** Assume a trava ou recusa. Dois workers sobre a mesma agenda nunca coexistem. */
export function iniciarWorker(e: EstadoDoWorker) {
  const agora = e.agora(); const t = lerTravaDoWorker(e.base);
  if (t?.ativo && t.instancia !== e.instancia && agora.getTime() - Date.parse(t.batimento) < 60000 && processoVivo(t.pid) && t.pid !== process.pid) throw new Error('WORKER_ALREADY_RUNNING');
  if (e.ativo) return;
  e.abort = new AbortController(); e.ativo = true; gravarTravaDoWorker(e, true);
  // Com a trava assumida, nenhum outro worker está vivo: todo EXECUTANDO que não é desta instância foi interrompido,
  // mesmo com batimento recente (queda e reabertura em menos de 2 min travariam a fila inteira). Só um trabalho ainda
  // em curso neste processo (parar() que esgotou a espera) mantém a tolerância por batimento.
  const recuperados = recuperarInterrompidos(e.base, agora, e.processando ? 120000 : 0);
  if (recuperados) emitirEventoDoWorker(e, 'WORKER_INTERROMPIDO', '', '', 'Execuções interrompidas recuperadas', `${recuperados} trabalho(s) estavam em andamento quando o Prumo foi encerrado; o histórico foi preservado.`);
  agendarProximaPassada(e, 0);
}
