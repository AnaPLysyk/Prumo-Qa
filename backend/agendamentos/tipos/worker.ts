/** Formato dos eventos do worker, da trava de instância única e do estado de cada rotina. */
import { z } from 'zod';
import { executarK6 } from '../k6/executarK6.js';
import { ExecutavelK6 } from './k6.js';
import { OperacaoServico } from '../../conexoes/tipos/adaptador.js';
import { Executor } from '../../conexoes/tipos/operacoesExternas.js';
import { executarValidacao } from '../../execucoes/regras/executarValidacao.js';
import { PublicadorJira } from '../../execucoes/tipos/comentarioJira.js';

/**
 * Worker de rotinas (2.8): UM laço no processo principal do Electron (sem serviço do Windows, sem tarefa agendada).
 * Adaptado do worker/daemon do QA Orchestrator: agenda -> fila -> execução autorizada -> registro, com trava de instância
 * única, batimento, recuperação de interrompidos, pausa e parada controlada. Usa o MESMO núcleo de execução e autorização
 * das execuções manuais; não conhece Claude/Codex.
 */
export type TipoEvento = 'AGENDAMENTO_INICIADO' | 'EXECUCAO_CONCLUIDA' | 'EXECUCAO_FALHOU' | 'EXECUCAO_BLOQUEADA' | 'PUBLICACAO_JIRA_FALHOU' | 'WORKER_INTERROMPIDO';

export type EventoWorker = { tipo: TipoEvento; rotinaId: string; trabalhoId: string; titulo: string; detalhe: string; at: string };

export interface ServicosLeitura extends Partial<Executor> { consultar(espacoId: string, servico: 'jira' | 'github', operacao: OperacaoServico, pagina?: { limite?: number }, id?: string): Promise<{ dados: unknown }> }

export type DepsWorker = {
  base?: string; agora?: () => Date; servicos?: (ServicosLeitura & PublicadorJira) | null; intervaloMs?: number;
  aoEvento?: (e: EventoWorker) => void; localizarK6?: () => Promise<ExecutavelK6 | null>; heartbeatMs?: number;
  executar?: typeof executarValidacao; executarK6?: typeof executarK6; semTemporizador?: boolean;
};

// ---- Trava de instância única + batimento ----
export const travaSchema = z.object({ instancia: z.string(), pid: z.number().int(), inicio: z.string().datetime(), batimento: z.string().datetime(), ativo: z.boolean() }).strict();

export const estadoRot = z.object({ version: z.literal(1), itens: z.record(z.object({ jira: z.record(z.string()).optional(), github: z.string().optional() }).strict()) }).strict();

export type EstadoRot = z.infer<typeof estadoRot>;

export const prioridade = { FAIL: 4, BLOCKED: 3, NOT_RUN: 2, PASS: 1 } as const;
