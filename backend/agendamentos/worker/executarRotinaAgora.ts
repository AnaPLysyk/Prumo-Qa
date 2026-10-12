/** "Executar agora": põe na fila um trabalho manual da rotina (testes pedem a aprovação humana do Windows a cada execução). */
import { randomUUID } from 'node:crypto';
import { enfileirar } from '../banco/enfileirar.js';
import { obterRotina } from '../banco/obterRotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { capacidadeDaRotinaAgendada } from './capacidadeDaRotinaAgendada.js';

export function executarRotinaAgora(e: EstadoDoWorker, rotinaId: string) {
  const r = obterRotina(rotinaId, e.base); const agora = e.agora();
  return enfileirar({ chave: `${r.id}@manual-${randomUUID()}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: capacidadeDaRotinaAgendada(r), ambiente: r.ambiente, ticket: r.ticket, origem: 'MANUAL', slot: null }, e.base, agora).trabalho;
}
