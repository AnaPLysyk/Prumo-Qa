/** Formato do registro das operações externas, das permissões de escrita por projeto e das opções de execução. */
import { z } from 'zod';
import { catalogoOperacoes } from '../escrita/catalogoOperacoes.js';
import { ContextoServico } from './adaptador.js';
import { Auxiliar } from './operacao.js';
import { Recurso, Servico, servicoSchema } from '../../projetos/tipos/espacos.js';

export const idsDeOperacao = catalogoOperacoes.map(o => o.id) as [string, ...string[]];

// Habilitação de escrita por projeto e serviço.
export const permSchema = z.object({ version: z.literal(1), itens: z.array(z.object({ espacoId: z.string().uuid(), servico: servicoSchema, em: z.string().datetime(), por: z.string().max(200) }).strict()).max(600) }).strict();

export type Perm = z.infer<typeof permSchema>;

// Livro-razão das operações.
const estados = ['PREPARADA', 'ENVIADA', 'CONFIRMADA', 'FALHA', 'BLOQUEADA'] as const;

const remotoSchema = z.object({ id: z.string().max(200).optional(), chave: z.string().max(200).optional(), url: z.string().max(500).optional(), detalhes: z.record(z.union([z.string().max(300), z.number(), z.boolean(), z.null()]).optional()).optional() }).strict();

export const itemSchema = z.object({
  id: z.string().uuid(), chave: z.string().length(64), espacoId: z.string().uuid(), servico: servicoSchema, operacao: z.string().max(60), resumo: z.string().max(400), estado: z.enum(estados),
  origem: z.enum(['MANUAL', 'AGENDADO']), tentativas: z.number().int(), vinculoId: z.string().uuid().optional(), conexaoId: z.string().uuid().optional(), remoto: remotoSchema.nullable(),
  erro: z.string().max(120).optional(), aviso: z.string().max(120).optional(), criadoEm: z.string().datetime(), atualizadoEm: z.string().datetime()
}).strict();

export type RegistroOperacao = z.infer<typeof itemSchema>;

export const razaoSchema = z.object({ version: z.literal(1), itens: z.array(itemSchema).max(1500) }).strict();

export type Razao = z.infer<typeof razaoSchema>;

export type Executor = { comContexto<T>(espacoId: string, servico: Servico, fn: (ctx: ContextoServico, rec: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>): Promise<T> };

export type OpcoesOperacao = { origem?: 'MANUAL' | 'AGENDADO'; confirmado?: boolean; aux?: Auxiliar; base?: string; agora?: () => Date; runPolitica?: number };

export const semAux: Auxiliar = { arquivosAutorizados: [], raizesDeEvidencia: [] };

// Uma operação por chave de cada vez: duas chamadas simultâneas (duplo clique, run manual concorrendo com a rotina)
// leriam o livro-razão antes do envio da outra e as duas enviariam. Em série, a segunda reutiliza ou reconcilia.
export const emCurso = new Map<string, Promise<unknown>>();

export type Entrada = Partial<RegistroOperacao> & { chave: string; espacoId: string; servico: Servico; operacao: string; resumo: string; origem: 'MANUAL' | 'AGENDADO'; estado: (typeof estados)[number] };
