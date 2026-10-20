/** Ciclo da agenda: identifica horários vencidos e executa uma passada. */
import { enfileirar, registrarPerdido, pegarProximoTrabalho } from "../banco/fila.js";
import { listarRotinas, agendaPausada } from "../banco/agenda.js";
import { horariosVencidos } from "../servicoHorarios.js";
import { marcarHorarioTratado } from "../regras/cicloDaRotina.js";
import { EstadoDoWorker } from "../tipos/worker.js";
import { capacidadeDaRotinaAgendada } from "./apoioDoWorker.js";
import { gravarTravaDoWorker } from "./travaDoWorker.js";
import { processarTrabalho } from "./processarTrabalho.js";
import { repetirPublicacoesPendentes } from "./processarTrabalho.js";

// enfileirarHorariosVencidos — responsabilidade deste trecho
export function enfileirarHorariosVencidos(e: EstadoDoWorker, agora: Date) {
  for (const r of listarRotinas(e.base)) {
    if (r.estado !== 'ATIVA') continue;
    for (const v of horariosVencidos(r, agora.getTime())) {
      const iso = new Date(v.slot).toISOString();
      const n = { chave: `${r.id}@${iso}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: capacidadeDaRotinaAgendada(r), ambiente: r.ambiente, ticket: r.ticket, origem: 'AGENDA' as const, slot: iso };
      if (v.executar) {
        try { enfileirar(n, e.base, agora); }
        catch (erro) { if ((erro as Error).message === 'QUEUE_ALREADY_ACTIVE' || (erro as Error).message === 'QUEUE_FULL') registrarPerdido(n, 'Pulado: a execução anterior desta rotina ainda estava ativa ou a fila estava cheia.', e.base, agora); else throw erro; }
      } else registrarPerdido(n, v.motivo === 'SUBSTITUIDO' ? 'Horário substituído por um mais recente (política: executar uma vez).' : 'Horário perdido: o Prumo estava fechado, o computador desligado/suspenso ou o atraso passou da tolerância. Nada foi executado.', e.base, agora);
      marcarHorarioTratado(r.id, v.slot, e.base);
    }
  }
}

// passadaDoWorker — responsabilidade deste trecho
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
