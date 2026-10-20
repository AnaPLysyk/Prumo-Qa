/** Lógica e contratos de tickets: operações relacionadas no mesmo módulo. */
import { z } from "zod";

/**
 * Escritas controladas no Jira Cloud (REST v3). Cada operação confere o projeto vinculado antes de escrever, usa só as rotas da
 * lista fechada (rotasDeEscrita.ts), verifica o efeito relendo o serviço e é idempotente por rótulo/anexo existente.
 * Endpoints: POST /issue, PUT /issue/{key}, POST /issue/{key}/attachments (header X-Atlassian-Token: no-check, campo "file"),
 * GET/POST /issue/{key}/transitions, POST /issueLink, GET /issue/createmeta/{project}/issuetypes (substitui o createmeta antigo).
 */
const chave = /^[A-Z][A-Z0-9_]*-\d+$/;

const idNum = z.string().regex(/^\d{1,12}$/);

const ticket = z.string().regex(chave);

const rotulo = z.string().regex(/^[A-Za-z0-9_.-]{1,50}$/);

export const criar = z.object({ tipoId: idNum, resumo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), rotulos: z.array(rotulo).max(10).default([]), origem: ticket.optional(), tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict();

export const anexar = z.object({ ticket, arquivo: z.string().min(1).max(500), nome: z.string().max(150).optional() }).strict();

export const tipos: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain', '.log': 'text/plain', '.json': 'application/json', '.html': 'text/html', '.zip': 'application/zip', '.pdf': 'application/pdf' };

export const editar = z.object({ ticket, resumo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), adicionarRotulos: z.array(rotulo).max(10).optional() }).strict().refine(p => p.resumo !== undefined || p.descricao !== undefined || (p.adicionarRotulos?.length ?? 0) > 0, 'nenhuma alteração');

export const transicionar = z.object({ ticket, transicaoId: idNum }).strict();

export const vincular = z.object({ ticket, comTicket: ticket, tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict().refine(p => p.ticket !== p.comTicket, 'mesmo ticket');

export const comentar = z.object({ ticket, texto: z.string().trim().min(3).max(4000) }).strict();

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
