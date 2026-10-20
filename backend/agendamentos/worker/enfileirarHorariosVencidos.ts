/** Para cada rotina ativa, põe na fila os horários vencidos que ainda dá tempo de rodar e registra como perdidos os que passaram. */
import { enfileirar } from '../banco/fila.js';
import { listarRotinas } from '../banco/agenda.js';
import { registrarPerdido } from '../banco/fila.js';
import { horariosVencidos } from '../servicoHorarios.js';
import { marcarHorarioTratado } from '../regras/operacoesDaRotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { capacidadeDaRotinaAgendada } from './apoioDoWorker.js';

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
