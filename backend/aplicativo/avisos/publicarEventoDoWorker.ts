/** Transforma um evento do worker em aviso da janela e, se a pessoa quiser, em notificação do Windows. */
import { Notification } from 'electron';
import { EventoWorker } from '../../agendamentos/tipos/worker.js';
import { empilharAviso } from './avisos.js';
import { atualizarBandeja } from '../bandeja/cicloDaBandeja.js';
import { navegarPara } from '../janela/controleDaJanela.js';
import { lerPreferencias } from '../../configuracoes/servico.js';

export function publicarEventoDoWorker(e: EventoWorker) {
  empilharAviso({ tipo: e.tipo, titulo: e.titulo, detalhe: e.detalhe, rotinaId: e.rotinaId || undefined });
  const p = lerPreferencias();
  if (p.notificarAgenda && !p.silenciar && Notification.isSupported() && e.tipo !== 'AGENDAMENTO_INICIADO') {
    const n = new Notification({ title: `Prumo QA — ${e.titulo}`, body: e.detalhe.slice(0, 200), silent: !p.som });
    n.on('click', () => navegarPara('execucoes')); n.show();
  }
  atualizarBandeja();
}
