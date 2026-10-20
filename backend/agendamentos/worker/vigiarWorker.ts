/** Se o worker parou sem a pessoa pedir, tenta religar e avisa; nunca finge que está ativo. */
import { workerDoAplicativo } from './workerDoAplicativo.js';
import { empilharAviso } from '../../aplicativo/avisos/avisos.js';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/servico.js';

/** Vigia o worker: se ele parar sem o usuário pedir, tenta reiniciar e avisa; nunca finge que está ativo. */
export function vigiarWorker() {
  if (estadoDoAplicativo.saindo || workerDoAplicativo.estado().executando) return;
  try { workerDoAplicativo.iniciar(); empilharAviso({ tipo: 'WORKER_INTERROMPIDO', titulo: 'Worker', detalhe: idiomaAtual() === 'en' ? 'The worker had stopped and was restarted.' : 'O worker tinha parado e foi reiniciado.' }); } catch { /* outra instância detém a trava */ }
}
