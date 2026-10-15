/** Formato do registro das publicações de comentário de resultado no Jira. */
import { z } from 'zod';

/**
 * Comentário de resultado de QA no Jira (2.8). Uma das escritas remotas do produto.
 * - Texto estruturado montado SOMENTE de dados locais da execução (contagens, motivo, referência da evidência);
 * - nunca afirma aprovação do ticket inteiro nem altera status/workflow;
 * - manual: prévia + confirmação nativa feitas pelo processo principal; agendada: política prévia (ticket+tipo+validade+limite);
 * - idempotente: registro local por (execução, ticket) + marcador pesquisável no próprio comentário.
 */
export interface PublicadorJira {
  comentarJira(espacoId: string, ticket: string, adf: unknown): Promise<{ id: string; vinculoId: string; conexaoId: string }>;
  procurarComentarioJira(espacoId: string, ticket: string, marcador: string): Promise<string | null>;
}

export const rotulo: Record<string, string> = { smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Validação por ticket', k6: 'Desempenho (k6)' };

export type Comentario = { texto: string; adf: unknown; marcador: string };

export const registroPub = z.object({
  chave: z.string().max(120), trabalhoId: z.string().uuid(), espacoId: z.string().uuid(), ticket: z.string().max(40), modo: z.enum(['MANUAL', 'AGENDADO']),
  estado: z.enum(['PREPARADO', 'PUBLICADO', 'FALHA', 'BLOQUEADO']), tentativas: z.number().int(), textoSha256: z.string().length(64), texto: z.string().max(8000),
  vinculoId: z.string().uuid().optional(), conexaoId: z.string().uuid().optional(), comentarioId: z.string().max(40).optional(), politicaId: z.string().uuid().optional(), consumida: z.boolean().default(false),
  publicadoEm: z.string().datetime().optional(), ultimaTentativa: z.string().datetime().optional(), erro: z.string().max(80).optional(), criadoEm: z.string().datetime()
}).strict();

export type Pub = z.infer<typeof registroPub>;

export const registro = z.object({ version: z.literal(1), itens: z.array(registroPub).max(1000) }).strict();

export type Registro = z.infer<typeof registro>;
