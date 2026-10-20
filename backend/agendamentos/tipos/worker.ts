/** worker: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { z } from "zod";
import { executarK6, ExecutavelK6 } from "../servicoK6.js";
import { OperacaoServico } from "../../conexoes/tipos/adaptador.js";
import { Executor } from "../../conexoes/tipos/operacoesExternas.js";
import { executarValidacao } from "../../testes/regras/executarValidacao.js";
import { PublicadorJira } from "../../testes/tipos/escritaQase.js";
import { tiposRotina } from "./rotina.js";

// --- worker ---
/**
 * Worker de rotinas: um laço no processo principal do Electron (sem serviço do Windows, sem tarefa agendada).
 * Adaptado do worker/daemon do QA Orchestrator: agenda -> fila -> execução autorizada -> registro, com trava de instância
 * única, batimento, recuperação de interrompidos, pausa e parada controlada. Usa o mesmo núcleo de execução e autorização
 * das execuções manuais; não conhece Claude/Codex.
 */
export type TipoEvento = 'AGENDAMENTO_INICIADO' | 'EXECUCAO_CONCLUIDA' | 'EXECUCAO_FALHOU' | 'EXECUCAO_BLOQUEADA' | 'PUBLICACAO_JIRA_FALHOU' | 'WORKER_INTERROMPIDO';

export type EventoWorker = { tipo: TipoEvento; rotinaId: string; trabalhoId: string; titulo: string; detalhe: string; at: string };

interface ServicosLeitura extends Partial<Executor> { consultar(espacoId: string, servico: 'jira' | 'github', operacao: OperacaoServico, pagina?: { limite?: number }, id?: string): Promise<{ dados: unknown }> }

export type DepsWorker = {
  base?: string; agora?: () => Date; servicos?: (ServicosLeitura & PublicadorJira) | null; intervaloMs?: number;
  aoEvento?: (e: EventoWorker) => void; localizarK6?: () => Promise<ExecutavelK6 | null>; heartbeatMs?: number;
  executar?: typeof executarValidacao; executarK6?: typeof executarK6; semTemporizador?: boolean;
};

// Trava de instância única e batimento.
export const travaSchema = z.object({ instancia: z.string(), pid: z.number().int(), inicio: z.string().datetime(), batimento: z.string().datetime(), ativo: z.boolean() }).strict();

export const estadoRot = z.object({ version: z.literal(1), itens: z.record(z.object({ jira: z.record(z.string()).optional(), github: z.string().optional() }).strict()) }).strict();

export type EstadoRot = z.infer<typeof estadoRot>;

export const prioridade = { FAIL: 4, BLOCKED: 3, NOT_RUN: 2, PASS: 1 } as const;

/** O que o worker guarda enquanto o aplicativo está aberto (cada função de agendamentos/worker recebe este estado). */
export type EstadoDoWorker = {
  readonly instancia: string; readonly d: DepsWorker; readonly agora: () => Date; readonly base?: string; readonly intervalo: number;
  temporizador: ReturnType<typeof setTimeout> | null; ativo: boolean; emTick: boolean; abort: AbortController;
  atual: Promise<void> | null; ultimoErro: string | null; emitidos: Map<string, number>; processando: boolean;
};

// --- fila ---
/**
 * Fila persistente de trabalhos. Adapta do QA Orchestrator (fila/worker): reivindicação única,
 * heartbeat, recuperação de interrompidos, retentativa com espera crescente e idempotência por chave.
 * Escrita síncrona e atômica; o worker é o único escritor (travado em worker.ts).
 */
const estadosTrabalho = ['PENDENTE', 'EXECUTANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO', 'PERDIDO'] as const;

const resultadoStatus = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'] as const;

const tentativa = z.object({ n: z.number().int(), inicio: z.string().datetime(), fim: z.string().datetime().nullable(), estado: z.enum(['EXECUTANDO', 'CONCLUIDA', 'ERRO', 'INTERROMPIDA']), codigo: z.string().max(80).optional() }).strict();

export const resultadoSchema = z.object({
  status: z.enum(resultadoStatus), motivo: z.string().max(600),
  contagem: z.object({ pass: z.number().int(), fail: z.number().int(), blocked: z.number().int(), notRun: z.number().int() }).strict().optional(),
  evidenciaId: z.string().uuid().optional(), ticket: z.string().max(40).optional(), detalhes: z.string().max(4000).optional()
}).strict();

export type ResultadoTrabalho = z.infer<typeof resultadoSchema>;

export const trabalhoSchema = z.object({
  id: z.string().uuid(), chave: z.string().min(1).max(200), rotinaId: z.string().uuid(), espacoId: z.string().uuid(),
  tipo: z.enum(tiposRotina), capability: z.string().max(80).optional(), ambiente: z.string().max(40), ticket: z.string().max(40).optional(),
  origem: z.enum(['AGENDA', 'MANUAL']), slot: z.string().datetime().nullable(),
  estado: z.enum(estadosTrabalho), tentativas: z.number().int(), maxTentativas: z.number().int().min(1).max(5),
  criadoEm: z.string().datetime(), disponivelEm: z.string().datetime(), iniciadoEm: z.string().datetime().nullable(), heartbeat: z.string().datetime().nullable(),
  terminadoEm: z.string().datetime().nullable(), resultado: resultadoSchema.nullable(), erro: z.string().max(120).nullable(),
  log: z.array(tentativa).max(10),
  jira: z.object({ estado: z.enum(['NAO_APLICAVEL', 'PREPARADO', 'PENDENTE', 'PUBLICADO', 'FALHA', 'BLOQUEADO']), comentarioId: z.string().max(100).optional(), codigo: z.string().max(80).optional() }).strict().default({ estado: 'NAO_APLICAVEL' })
}).strict();

export type Trabalho = z.infer<typeof trabalhoSchema>;

export const registro = z.object({ version: z.literal(1), trabalhos: z.array(trabalhoSchema).max(1500) }).strict();

export type Registro = z.infer<typeof registro>;

export const LIMITE = 1500;

export const ESPERA_BASE_MS = 30000;

export type NovoTrabalho = { chave: string; rotinaId: string; espacoId: string; tipo: Trabalho['tipo']; capability?: string; ambiente: string; ticket?: string; origem: 'AGENDA' | 'MANUAL'; slot: string | null; maxTentativas?: number };
