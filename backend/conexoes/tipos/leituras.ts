/** Consultas de detalhe extras e os filtros aceitos na busca de tickets. */
import { z } from 'zod';

/**
 * Leituras adicionais (2.9) dos três serviços. Todas são GET com parâmetros montados aqui (nada vem de URL livre) e conferem
 * que o recurso pertence ao projeto/repositório vinculado. Limites: logs de workflow e download de artefatos exigem redirecionamento,
 * que o Prumo bloqueia por segurança; por isso só metadados e links oficiais são apresentados.
 */
export const operacoesExtras = ['metadados', 'campos-tipo', 'transicoes', 'historico', 'anexos', 'plano', 'campos-sistema', 'arquivos', 'workflows', 'jobs', 'artefatos', 'revisoes', 'commit', 'issues', 'marcos', 'ambientes', 'campos-personalizados'] as const;

export type OperacaoExtra = typeof operacoesExtras[number];

export const filtrosSchema = z.object({
  q: z.string().trim().max(100).optional(), tipo: z.string().regex(/^[\p{L}\p{N} _.-]{1,60}$/u).optional(), status: z.string().regex(/^[\p{L}\p{N} _.-]{1,60}$/u).optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), pai: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(),
  ref: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).optional(), branch: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).optional()
}).strict();

export type Filtros = z.infer<typeof filtrosSchema>;

export type Pg = { offset: number; limite: number };
