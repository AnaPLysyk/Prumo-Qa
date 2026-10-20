/** Formato das autorizações de execução e das políticas de publicação no Jira e escrita no Qase, com validade e usos. */
import { z } from 'zod';
import { solicitarAprovacao } from '../../testes/aprovacao/solicitarAprovacao.js';

/**
 * Autorizações para trabalho agendado.
 *
 * Execução de testes: a pessoa aprova uma vez, pelo mesmo broker nativo do Windows usado nas execuções manuais,
 * um escopo exato (projeto + capability + hash do comando, ambiente e fontes). A autorização guarda esse hash, uma
 * validade, um limite de execuções e pode ser revogada. Se o projeto, o comando ou o ambiente mudarem, o hash muda e a
 * autorização deixa de valer: o trabalho fica BLOCKED. Não existe autorização global nem para "qualquer comando".
 * O broker não é alterado nem contornado: o consentimento acontece aqui, na criação, e é comprovado pelo retorno dele.
 *
 * Publicação no Jira: política separada, restrita a tickets explícitos e tipos de rotina, com validade e limite.
 */
export const MAX_VALIDADE_DIAS = 30;

export const MAX_USOS = 1000;

export const execSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), projectId: z.string().max(80), capability: z.string().max(80), ambiente: z.string().max(40),
  scopeHash: z.string().regex(/^[0-9a-f]{64}$/), criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxUsos: z.number().int().min(1).max(MAX_USOS), usos: z.number().int().min(0),
  aprovadoPor: z.string().max(200), metodo: z.string().max(80), revogadaEm: z.string().datetime().nullable()
}).strict();

export const pubSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), tickets: z.array(z.string().regex(/^[A-Z][A-Z0-9_]+-\d+$/)).min(1).max(20),
  tipos: z.array(z.enum(['smoke', 'regressao', 'validacao-ticket', 'k6'])).min(1).max(4),
  criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxPublicacoes: z.number().int().min(1).max(MAX_USOS), usadas: z.number().int().min(0),
  aprovadoPor: z.string().max(200), revogadaEm: z.string().datetime().nullable()
}).strict();

// Política de escrita agendada para operações externas explicitamente permitidas (hoje: publicar resultados no Qase).
export const OPERACOES_AGENDAVEIS = ['qase.publicar_resultados'] as const;

export const escritaSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), operacao: z.enum(OPERACOES_AGENDAVEIS), runs: z.array(z.number().int().positive()).min(1).max(20),
  criadaEm: z.string().datetime(), validaAte: z.string().datetime(), maxUsos: z.number().int().min(1).max(MAX_USOS), usos: z.number().int().min(0), aprovadoPor: z.string().max(200), revogadaEm: z.string().datetime().nullable()
}).strict();

export type PoliticaEscrita = z.infer<typeof escritaSchema>;

export type AutorizacaoExecucao = z.infer<typeof execSchema>;

export type PoliticaPublicacao = z.infer<typeof pubSchema>;

export const registro = z.object({ version: z.literal(1), execucoes: z.array(execSchema).max(300), publicacoes: z.array(pubSchema).max(300), escritas: z.array(escritaSchema).max(300).default([]) }).strict();

export type Registro = z.infer<typeof registro>;

export type Solicitador = typeof solicitarAprovacao;

export type EscopoAutorizado = { scopeHash: string; command: string };
