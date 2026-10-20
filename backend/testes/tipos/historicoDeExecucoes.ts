/** Filtros aceitos pelo histórico de execuções. */
import { z } from 'zod';

/**
 * Histórico centralizado: une os trabalhos da fila (execuções, consultas, horários perdidos) com rotina, projeto,
 * ticket e repositório vinculado. Consulta apenas dados locais já registrados; nada é recalculado nem inventado.
 * Métricas contam execuções de QA reais (PASS/FAIL/BLOCKED/NOT_RUN). Consultas (INFO) e horários perdidos ficam à parte,
 * e abrir a interface nunca conta como execução.
 */
export const filtroExecucoes = z.object({
  espacoId: z.string().uuid().optional(), rotinaId: z.string().uuid().optional(), ticket: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(),
  repositorio: z.string().max(200).optional(), estado: z.enum(['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO']).optional(),
  resultado: z.enum(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO']).optional(),
  since: z.string().datetime().optional(), until: z.string().datetime().optional(), limite: z.number().int().min(1).max(500).default(100)
}).strict();

export type FiltroExecucoes = z.input<typeof filtroExecucoes>;
