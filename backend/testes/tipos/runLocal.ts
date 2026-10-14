/** Formato de uma run local (casos, resultados, publicações) e a tradução de estados para o Qase. */
import { z } from 'zod';
import { Executor } from '../../conexoes/tipos/operacoesExternas.js';
import { executarValidacao } from '../regras/executarValidacao.js';
import { Delegada } from './execucao.js';

/**
 * Fluxo real de QA com o Qase (2.9): casos -> plano/run -> execução autorizada das automações associadas -> resultados verificáveis ->
 * publicação -> releitura da run. Uma "run local" guarda o que o Prumo sabe e observou; nada aqui afirma execução que não houve:
 *  - run criada NÃO é run executada;
 *  - caso manual sem resultado declarado pela pessoa fica sem resultado (NOT_RUN) e não é publicado;
 *  - PASS só existe com execução real (ou declaração humana explícita, marcada MANUAL);
 *  - automação que cobre vários casos sem mapeamento por cenário não decide o resultado de nenhum deles.
 * A associação caso -> automação vem das relações declaradas (qase -> automacao); "capability#cenario" liga ao cenário do runner.
 */
export const statusLocal = z.enum(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);

export const resultadoSchema = z.object({ status: statusLocal, origem: z.enum(['EXECUCAO', 'MANUAL']), granularidade: z.enum(['CENARIO', 'RODADA', 'DECLARADO']), evidenciaId: z.string().uuid().optional(), comentario: z.string().max(2000).default(''), tempoMs: z.number().int().min(0).optional(), por: z.string().max(200).optional(), em: z.string().datetime() }).strict();

export const casoSchema = z.object({ casoId: z.number().int().positive(), titulo: z.string().max(255), capability: z.string().max(80).nullable(), casoRunner: z.string().max(100).nullable(), resultado: resultadoSchema.nullable(), publicado: z.boolean() }).strict();

export const runSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), titulo: z.string().max(255), ambiente: z.string().max(40), runIdRemoto: z.number().int().positive().nullable(), planoId: z.number().int().positive().nullable(),
  estado: z.enum(['PREPARADA', 'CRIADA', 'EXECUTADA', 'PARCIAL', 'PUBLICADA']), confirmadaNoQase: z.boolean(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime(), casos: z.array(casoSchema).min(1).max(500),
  execucoes: z.array(z.object({ capability: z.string().max(80), evidenciaId: z.string().uuid(), status: statusLocal, em: z.string().datetime() }).strict()).max(200),
  publicacoes: z.array(z.object({ em: z.string().datetime(), estado: z.string().max(20), enviados: z.number().int(), operacaoId: z.string().uuid() }).strict()).max(200)
}).strict();

export type RunLocal = z.infer<typeof runSchema>;

export const registro = z.object({ version: z.literal(1), itens: z.array(runSchema).max(300) }).strict();

export type Registro = z.infer<typeof registro>;

export type Dep = { executor: Executor; base?: string; agora?: () => Date };

export type Execucao = { executar: typeof executarValidacao; modo: 'MANUAL' | 'AGENDADO'; delegada?: (espacoId: string, ambiente: string) => Delegada; signal?: AbortSignal };

export const paraQase = { PASS: 'passed', FAIL: 'failed', BLOCKED: 'blocked' } as const;
