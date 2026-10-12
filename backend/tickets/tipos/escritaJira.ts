/** Formatos aceitos nas operações de escrita no Jira (criar, anexar, editar, transicionar, vincular, comentar). */
import { z } from 'zod';

/**
 * Escritas controladas no Jira Cloud (REST v3). Cada operação confere o projeto vinculado antes de escrever, usa só as rotas da
 * lista fechada (rotasEscrita.ts), verifica o efeito relendo o serviço e é idempotente por rótulo/anexo existente.
 * Endpoints: POST /issue, PUT /issue/{key}, POST /issue/{key}/attachments (header X-Atlassian-Token: no-check, campo "file"),
 * GET/POST /issue/{key}/transitions, POST /issueLink, GET /issue/createmeta/{project}/issuetypes (substitui o createmeta antigo).
 */
export const chave = /^[A-Z][A-Z0-9_]*-\d+$/;

export const idNum = z.string().regex(/^\d{1,12}$/);

export const ticket = z.string().regex(chave);

export const rotulo = z.string().regex(/^[A-Za-z0-9_.-]{1,50}$/);

export const criar = z.object({ tipoId: idNum, resumo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), rotulos: z.array(rotulo).max(10).default([]), origem: ticket.optional(), tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict();

export const anexar = z.object({ ticket, arquivo: z.string().min(1).max(500), nome: z.string().max(150).optional() }).strict();

export const tipos: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain', '.log': 'text/plain', '.json': 'application/json', '.html': 'text/html', '.zip': 'application/zip', '.pdf': 'application/pdf' };

export const editar = z.object({ ticket, resumo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), adicionarRotulos: z.array(rotulo).max(10).optional() }).strict().refine(p => p.resumo !== undefined || p.descricao !== undefined || (p.adicionarRotulos?.length ?? 0) > 0, 'nenhuma alteração');

export const transicionar = z.object({ ticket, transicaoId: idNum }).strict();

export const vincular = z.object({ ticket, comTicket: ticket, tipoVinculo: z.string().regex(/^[A-Za-z ]{2,40}$/).default('Relates') }).strict().refine(p => p.ticket !== p.comTicket, 'mesmo ticket');

export const comentar = z.object({ ticket, texto: z.string().trim().min(3).max(4000) }).strict();
