/** Mantém o worker de agendamentos independente da janela; o aplicativo conecta os avisos ao iniciar. */
import { Worker } from './Worker.js';
import { type EventoWorker } from '../tipos/worker.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';

let notificar: ((evento: EventoWorker) => void) | null = null;

/** Liga os avisos do Electron sem fazer o worker importar bandeja, janela ou notificações. */
export function conectarAvisosDoWorker(publicar: (evento: EventoWorker) => void) {
  notificar = publicar;
}

export const workerDoAplicativo = new Worker({
  servicos: servicosDoAplicativo as never,
  aoEvento: evento => notificar?.(evento)
});
