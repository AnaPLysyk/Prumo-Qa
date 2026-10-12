/** Monta o corpo do caso de teste enviado ao Qase, com segredos mascarados. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { esquemaCaso } from '../tipos/escritaQase.js';

export const corpoDoCasoQase = (p: z.infer<typeof esquemaCaso>) => ({
  title: mascarar(p.titulo), description: mascarar(p.descricao), preconditions: mascarar(p.preCondicoes), postconditions: mascarar(p.posCondicoes),
  steps: p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })), steps_type: 'classic',
  isManual: p.automacao !== 'automatizado', isToBeAutomated: p.automacao === 'a-automatizar', tags: p.tags,
  ...(p.suiteId ? { suite_id: p.suiteId } : {}), ...(p.prioridade !== undefined ? { priority: p.prioridade } : {}), ...(p.severidade !== undefined ? { severity: p.severidade } : {}), ...(p.tipo !== undefined ? { type: p.tipo } : {})
});
