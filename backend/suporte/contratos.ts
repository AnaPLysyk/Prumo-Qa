/** Lógica e contratos de suporte: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import fs from "node:fs";
import { repositorio } from "../ajuda/contratos.js";

const MB = 1024 * 1024;

/** Tipos aceitos, conferidos pela assinatura do arquivo (a extensão sozinha não vale). */
export const tiposDeAnexo = {
  'image/png': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['png'] }, 'image/jpeg': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['jpg', 'jpeg'] }, 'image/webp': { tipo: 'imagem', maximo: 5 * MB, extensoes: ['webp'] },
  'video/mp4': { tipo: 'video', maximo: 25 * MB, extensoes: ['mp4'] }, 'video/webm': { tipo: 'video', maximo: 25 * MB, extensoes: ['webm'] }
} as const;

export type TipoDeAnexo = keyof typeof tiposDeAnexo;

export const quantosAnexos = { imagem: 3, video: 1 } as const;

export const estadosDoChamado = ['NOVO', 'EM_ANALISE', 'RESOLVIDO', 'FECHADO'] as const;

export const estadoDoChamadoSchema = z.enum(estadosDoChamado);

/** Anexo escolhido no diálogo do sistema: a janela recebe só id, nome, tipo e tamanho; o caminho fica no processo principal. */
export type AnexoEscolhido = { id: string; nome: string; tipo: TipoDeAnexo; tamanho: number };

/** O que fica neste computador sobre cada chamado aberto: a chave de acompanhamento vai protegida pelo cofre do sistema. */
const meuChamadoSchema = z.object({
  usuarioId: z.string().uuid(), numero: z.number().int().min(1).max(999999999), titulo: z.string().max(200), categoria: z.enum(['bug', 'melhoria', 'sugestao']),
  criadoEm: z.string().datetime(), chave: z.string().max(2000).nullable()
}).strict();

export const meusChamadosSchema = z.object({ version: z.literal(1), chamados: z.array(meuChamadoSchema).max(2000) }).strict();

export const numeroChamado = z.number().int().min(1).max(999999999);

export const statusChamados = z.array(z.object({id:z.string(),nome:z.string(),rotulo:z.string(),cor:z.string().regex(/^[a-f0-9]{6}$/),explicacao:z.string()}).strict()).parse(JSON.parse(fs.readFileSync(new URL('../../docs/catalogo/suporte-status.json',import.meta.url),'utf8')));

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
