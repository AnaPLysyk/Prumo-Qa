/** Formato de um registro do diagnóstico da janela (só metadados) e seus limites. */
import { z } from 'zod';

/**
 * Diagnóstico técnico das chamadas IPC da interface. Fica em %LOCALAPPDATA%\PrumoQA\diagnostico, separado do
 * histórico de operações de QA: não entra em métricas e consultar a tela não gera evento de qualidade.
 * Só metadados (canal, estado, duração, código, correlação). Nunca argumentos, caminhos, conteúdo ou segredos.
 */
export const limiteArquivo = 1024 * 1024;

export const nomeValido = /^ipc-\d{4}-\d{2}-\d{2}\.jsonl$/;

export const eventoDiagnosticoSchema = z.object({
  at: z.string().datetime(), channel: z.string().regex(/^[a-z]+:[a-z]+$/).max(40), state: z.enum(['OK', 'ERROR']),
  durationMs: z.number().finite().nonnegative(), code: z.string().regex(/^[A-Z_]{3,64}$/).optional(), correlationId: z.string().uuid()
}).strict();

export type EventoDiagnostico = z.infer<typeof eventoDiagnosticoSchema>;
