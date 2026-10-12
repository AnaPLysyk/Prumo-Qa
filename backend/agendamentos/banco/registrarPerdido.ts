/** Registra um horário que não vai rodar (perdido ou substituído) sem confundir com execução. */
import { randomUUID } from 'node:crypto';
import { gravarFila } from './gravarFila.js';
import { lerFila } from './lerFila.js';
import { NovoTrabalho, trabalhoSchema } from '../tipos/fila.js';

/** Registra um slot que não será executado (PERDIDO/SUBSTITUIDO) sem confundir com execução. Idempotente pela chave. */
export function registrarPerdido(n: NovoTrabalho, motivo: string, base?: string, agora = new Date()) {
  const r = lerFila(base); if (r.trabalhos.some(t => t.chave === n.chave)) return;
  const iso = agora.toISOString();
  r.trabalhos.push(trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PERDIDO', tentativas: 0, maxTentativas: 1, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: iso, resultado: { status: 'NOT_RUN', motivo }, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } }));
  gravarFila(r, base);
}
