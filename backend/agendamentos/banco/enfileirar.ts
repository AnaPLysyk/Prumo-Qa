/** Coloca um trabalho na fila uma única vez (a mesma chave nunca vira dois trabalhos). */
import { randomUUID } from 'node:crypto';
import { gravarFila } from './gravarFila.js';
import { lerFila } from './lerFila.js';
import { NovoTrabalho, Trabalho, trabalhoSchema } from '../tipos/fila.js';

/** Idempotente: a mesma chave nunca vira dois trabalhos. Retorna `criado:false` se já existir. */
export function enfileirar(n: NovoTrabalho, base?: string, agora = new Date()): { trabalho: Trabalho; criado: boolean } {
  const r = lerFila(base); const existente = r.trabalhos.find(t => t.chave === n.chave); if (existente) return { trabalho: existente, criado: false };
  if (r.trabalhos.filter(t => t.estado === 'PENDENTE').length >= 200) throw new Error('QUEUE_FULL');
  if (n.origem === 'AGENDA' && r.trabalhos.some(t => t.rotinaId === n.rotinaId && (t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO'))) throw new Error('QUEUE_ALREADY_ACTIVE');
  const iso = agora.toISOString();
  const t: Trabalho = trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PENDENTE', tentativas: 0, maxTentativas: n.maxTentativas ?? 3, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: null, resultado: null, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } });
  r.trabalhos.push(t); gravarFila(r, base); return { trabalho: t, criado: true };
}
