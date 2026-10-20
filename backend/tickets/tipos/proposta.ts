/** Formato das propostas de caso e de bug, da revisão e os limites (300 propostas, 20 da IA por hora). */
import { z } from 'zod';

/**
 * Propostas de casos de teste e de bugs: rascunhos locais revisáveis, criados pela pessoa, pelo Prumo (a partir de uma falha) ou por uma
 * IA conectada. Uma proposta nunca é publicada sozinha: publicar exige a revisão da pessoa (duplicidade, requisito, risco e cobertura, no caso
 * de IA) e a confirmação da operação externa. A IA só chega aqui pela ferramenta MCP propor_caso, limitada por política e por quantidade.
 */
export const MAX_PROPOSTAS = 300;

export const MAX_IA_POR_HORA = 20;

export const classificacoesDeFalha = ['PRODUTO', 'OUTRO_BUG', 'MELHORIA'] as const;

export const dadosBug = z.object({ classificacao: z.enum(classificacoesDeFalha).optional(), resumo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), origem: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(), rotulos: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,50}$/)).max(10).default([]), tipoId: z.string().regex(/^\d{1,12}$/).optional() }).strict();

const revisaoSchema = z.object({ duplicidade: z.boolean(), requisito: z.boolean(), risco: z.boolean(), cobertura: z.boolean(), por: z.string().max(200), em: z.string().datetime() }).strict();

export const propostaSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), tipo: z.enum(['caso', 'bug']), origem: z.enum(['PESSOA', 'PRUMO', 'IA']), cliente: z.string().max(60).optional(),
  estado: z.enum(['RASCUNHO', 'REVISADA', 'PUBLICADA', 'VINCULADA', 'DESCARTADA']), titulo: z.string().max(255), dados: z.record(z.unknown()), requisito: z.string().max(500).default(''), risco: z.string().max(300).default(''),
  similares: z.array(z.string().uuid()).max(10).default([]), revisao: revisaoSchema.nullable().default(null), remoto: z.object({ id: z.string().optional(), chave: z.string().optional(), url: z.string().optional() }).strict().nullable().default(null),
  falhaDeOrigem: z.object({ runLocalId: z.string().uuid(), casoId: z.number().int() }).strict().optional(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();

export type Proposta = z.infer<typeof propostaSchema>;

export const registro = z.object({ version: z.literal(1), itens: z.array(propostaSchema).max(MAX_PROPOSTAS) }).strict();

export type Registro = z.infer<typeof registro>;

export type NovaProposta = { espacoId: string; tipo: 'caso' | 'bug'; origem: 'PESSOA' | 'PRUMO' | 'IA'; cliente?: string; dados: unknown; requisito?: string; risco?: string; falhaDeOrigem?: Proposta['falhaDeOrigem'] };
