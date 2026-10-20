/** Uma passada do worker: bate o coração, transforma horários vencidos em trabalhos, executa um trabalho e tenta publicações pendentes. */
import { agendaPausada } from '../repositorioAgenda.js';
import { listarRotinas } from '../repositorioAgenda.js';
import { pegarProximoTrabalho } from '../repositorioFila.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { enfileirarHorariosVencidos } from './enfileirarHorariosVencidos.js';
import { gravarTravaDoWorker } from './travaDoWorker.js';
import { processarTrabalho } from './processarTrabalho.js';
import { repetirPublicacoesPendentes } from './publicacoes.js';

export async function passadaDoWorker(e: EstadoDoWorker) {
  if (e.emTick) return; e.emTick = true;
  try {
    const agora = e.agora(); if (e.ativo) gravarTravaDoWorker(e, true);
    if (!agendaPausada(e.base)) enfileirarHorariosVencidos(e, agora);
    if (e.ativo && !agendaPausada(e.base)) {
      const pausadas = new Set(listarRotinas(e.base).filter(r => r.estado !== 'ATIVA').map(r => r.id));
      const t = pegarProximoTrabalho(e.base, e.agora(), x => x.origem === 'AGENDA' && pausadas.has(x.rotinaId));
      if (t) await processarTrabalho(e, t);
    }
    if (e.ativo && !agendaPausada(e.base)) await repetirPublicacoesPendentes(e);
  } finally { e.emTick = false; }
}
