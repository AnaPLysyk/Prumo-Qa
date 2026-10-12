/** Categorias, modelos e limites do relato de suporte e o formato da solicitação. */
import { z } from 'zod';
import { repositorio } from '../../ajuda/tipos/versao.js';

export const categorias = ['bug', 'melhoria', 'sugestao'] as const;

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
