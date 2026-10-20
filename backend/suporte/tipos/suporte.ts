/** Categorias, modelos e limites do relato de suporte, o formato da solicitação e o de uma issue consultada no GitHub. */
import fs from 'node:fs';
import { z } from 'zod';
import { repositorio } from '../../ajuda/tipos/versoes.js';

export const numeroChamado = z.number().int().min(1).max(999999999);

export const statusChamados = z.array(z.object({id:z.string(),nome:z.string(),rotulo:z.string(),cor:z.string().regex(/^[a-f0-9]{6}$/),explicacao:z.string()}).strict()).parse(JSON.parse(fs.readFileSync(new URL('../../../docs/catalogo/suporte-status.json',import.meta.url),'utf8')));

const autor=z.object({login:z.string().max(100)}).nullable();

export const issueSchema=z.object({number:numeroChamado,title:z.string().max(1000),state:z.enum(['open','closed']),created_at:z.string().datetime(),updated_at:z.string().datetime(),user:autor,assignees:z.array(z.object({login:z.string().max(100)})).max(100),labels:z.array(z.object({name:z.string().max(100)})).max(100),pull_request:z.unknown().optional()});

export const eventoSchema=z.object({event:z.string().max(100),created_at:z.string().datetime(),actor:autor,label:z.object({name:z.string().max(100)}).optional()});

const categorias = ['bug', 'melhoria', 'sugestao'] as const;

export const rotulo = { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' } as const;

export const modelo = { bug: 'bug.yml', melhoria: 'melhoria.yml', sugestao: 'sugestao.yml' } as const;

export const solicitacaoSchema = z.object({
  categoria: z.enum(categorias), titulo: z.string().trim().min(5).max(120), descricao: z.string().trim().min(10).max(4000),
  esperado: z.string().trim().max(2000).optional(), passos: z.string().trim().max(2000).optional(),
  incluirVersao: z.boolean().default(true), incluirSistema: z.boolean().default(false), incluirDiagnostico: z.boolean().default(false),
  consentimento: z.literal(true)
}).strict();

export type Solicitacao = z.infer<typeof solicitacaoSchema>;

export type Contexto = { versao: string; diagnostico?: string };

export const AVISO_PUBLICO = 'Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais nos relatos públicos.';

export const urlBase = `https://github.com/${repositorio}/issues/new`;

export const limiteUrl = 7000;

export const padraoLink = new RegExp(`^https://github\\.com/${repositorio.replace('/', '\\/').replace('.', '\\.')}/issues/\\d{1,9}$`);

export type Achado = { tipo: string; trecho: string };
