/** Formato dos eventos do worker, da trava de instância única e do estado de cada rotina. */
import { z } from 'zod';
import { executarK6 } from '../k6/executarK6.js';
import { ExecutavelK6 } from './k6.js';
import { OperacaoServico } from '../../conexoes/tipos/adaptador.js';
import { Executor } from '../../conexoes/tipos/operacoesExternas.js';
import { executarValidacao } from '../../testes/regras/executarValidacao.js';
import { PublicadorJira } from '../../testes/tipos/comentarioJira.js';

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
