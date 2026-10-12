/** Prepara um registro do diário de operações para a tela, com o texto dos achados e "sem término observado" quando a operação não terminou. */
import { descreverAchados } from './descreverAchados.js';
import { Evento } from '../tipos/atividade.js';

/** `consolidado`: o último evento da operação; se ainda for o início, nenhum término foi observado. */
export function apresentarRegistroDoDiario(e: Evento, consolidado = false) {
  return { operationId: e.operationId, at: e.at, phase: e.phase, tool: e.tool, origin: e.origin, client: e.client, clientIdentity: e.clientIdentity,
    state: consolidado && e.phase === 'start' ? 'SEM_TERMINO_OBSERVADO' : e.state, durationMs: e.durationMs, input: e.input, summary: e.summary, findingsText: descreverAchados(e) };
}
