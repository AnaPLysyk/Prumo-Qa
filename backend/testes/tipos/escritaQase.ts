/** Formatos aceitos nas operações de escrita no Qase (suite, caso, plano, run, resultados, anexo). */
import { z } from 'zod';

export const id = z.number().int().positive().max(999999999999);

export const ticket = z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/);

export const campoInt = z.number().int().min(0).max(100);

export type Pagina = { entities: Record<string, unknown>[] };

export const passo = z.object({ acao: z.string().trim().min(1).max(2000), esperado: z.string().max(2000).default(''), dados: z.string().max(2000).default('') }).strict();

export const criarSuite = z.object({ titulo: z.string().trim().min(2).max(255), descricao: z.string().max(4000).default(''), paiId: id.optional() }).strict();

export const esquemaCaso = z.object({
  titulo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), preCondicoes: z.string().max(4000).default(''), posCondicoes: z.string().max(4000).default(''),
  passos: z.array(passo).max(50).default([]), suiteId: id.optional(), prioridade: campoInt.optional(), severidade: campoInt.optional(), tipo: campoInt.optional(),
  automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).default('manual'), tags: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/)).max(10).default([]), ticket: ticket.optional()
}).strict();

export const editarCaso = z.object({ casoId: id, titulo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), preCondicoes: z.string().max(4000).optional(), passos: z.array(passo).max(50).optional(), prioridade: campoInt.optional(), automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).optional() }).strict().refine(p => Object.keys(p).length > 1, 'nenhuma alteração');

export const associarTicket = z.object({ casoId: id, ticket }).strict();

export const criarPlano = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(500) }).strict();

export const criarRun = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(500), planoId: id.optional(), autoteste: z.boolean().default(false) }).strict();

export const completarRun = z.object({ runId: id }).strict();

export const statusQase = z.enum(['passed', 'failed', 'blocked', 'skipped']);

export const resultado = z.object({ casoId: id, status: statusQase, tempoMs: z.number().int().min(0).max(31536000000).optional(), comentario: z.string().max(2000).default(''), stacktrace: z.string().max(4000).optional(), anexos: z.array(z.string().regex(/^[a-f0-9]{16,64}$/)).max(10).optional() }).strict();

export const publicar = z.object({ runId: id, resultados: z.array(resultado).min(1).max(200) }).strict();

export const anexar = z.object({ arquivo: z.string().min(1).max(500) }).strict();
