/** Formato de um contexto (requisito, regra, critério, restrição, decisão), seus estados, limites e histórico encadeado. */
import { z } from 'zod';

/**
 * Contextos persistentes por projeto (requisitos, regras, critérios, restrições, decisões).
 * Armazenamento local próprio (não altera qa.project.json), isolado por projeto, em %LOCALAPPDATA%\PrumoQA\contextos.
 * Cada contexto é um arquivo cujo histórico é encadeado por hash: adulteração é detectada e o contexto adulterado nunca vai ao MCP.
 * Regras de confiança: um contexto só é APROVADO por uma ação humana explícita (IPC com confirmação nativa; nunca por MCP);
 * editar um contexto aprovado volta a RASCUNHO; conflitos nunca são resolvidos em silêncio.
 */
export const tipos = ['requisito', 'regra_negocio', 'criterio_aceite', 'restricao_tecnica', 'decisao'] as const;

export const estados = ['RASCUNHO', 'APROVADO', 'CONFLITANTE', 'DESATUALIZADO'] as const;

export const limites = { titulo: 200, texto: 20000, chave: 60, referencia: 500, contextos: 500, historico: 200, textoMcp: 4000 } as const;

export type Tipo = (typeof tipos)[number];

export type Estado = (typeof estados)[number];

export const origemSchema = z.object({ tipo: z.enum(['documento', 'pessoa', 'ia_sugerido', 'outro']), referencia: z.string().max(limites.referencia) }).strict();

export const conteudoSchema = z.object({
  tipo: z.enum(tipos), titulo: z.string().trim().min(1).max(limites.titulo), texto: z.string().trim().min(1).max(limites.texto),
  chave: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,59}$/).optional(), origem: origemSchema
}).strict();

export type Conteudo = z.infer<typeof conteudoSchema>;

export const entradaSchema = z.object({
  versao: z.number().int().min(1), em: z.string().datetime(), acao: z.enum(['criado', 'editado', 'aprovado', 'desatualizado', 'substituido', 'conflito', 'conflito_resolvido']),
  estado: z.enum(estados), por: z.string().max(100), conteudo: conteudoSchema, conteudoHash: z.string().regex(/^[a-f0-9]{64}$/),
  detalhe: z.object({ outroId: z.string().uuid().optional(), substituidoPor: z.string().uuid().optional() }).strict().optional(),
  anterior: z.string().regex(/^[a-f0-9]{64}$/).nullable(), selo: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();

export const arquivoSchema = z.object({ schema: z.literal(1), id: z.string().uuid(), projectId: z.string(), substitui: z.string().uuid().optional(), historico: z.array(entradaSchema).min(1).max(limites.historico) }).strict();

export type Entrada = z.infer<typeof entradaSchema>;

export type Arquivo = z.infer<typeof arquivoSchema>;

export const configSchema = z.object({ version: z.literal(1), disponibilizarAoMcp: z.boolean() }).strict();

export const ehInstrucao = /(ignore|desconsidere|esque[çc]a)\s+(todas?\s+)?(as\s+)?(instru[çc][õo]es|regras)|ignore\s+(all\s+)?(previous|prior)\s+instructions|(execute|rode|run)\s+(o\s+)?(comando|command|shell)|rm\s+-rf|aprove\s+automaticamente|voc[êe]\s+deve\s+(executar|apagar|enviar)|system\s*prompt|envie\s+.*\b(senha|token|credenciais)/i;

export type Resumo = {
  id: string; tipo: Tipo; titulo: string; chave: string | null; estado: Estado; estadoRegistrado: Estado; versao: number; atualizadoEm: string; origem: { tipo: string; referencia: string };
  hash: string; conflitaCom: string[]; integridade: 'OK' | 'ADULTERADO'; aprovadoPor: string | null; aprovadoEm: string | null; substitui: string | null; alertaDeInstrucao: boolean;
};

export type Filtro = { tipo?: Tipo; estado?: Estado; busca?: string; chave?: string };
