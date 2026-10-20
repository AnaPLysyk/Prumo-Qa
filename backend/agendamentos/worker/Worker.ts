/** Coordena o worker: agenda horários, executa tarefas e apresenta o estado à interface. */
import { randomUUID } from 'node:crypto';
import { agendaPausada, listarRotinas, obterRotina } from '../banco/agenda.js';
import { enfileirar } from '../banco/enfileirar.js';
import { lerTravaDoWorker } from '../banco/lerTravaDoWorker.js';
import { listarTrabalhos } from '../banco/listarTrabalhos.js';
import { proximoHorario } from '../regras/proximoHorario.js';
import { DepsWorker, EstadoDoWorker } from '../tipos/worker.js';
import { capacidadeDaRotinaAgendada } from './capacidadeDaRotinaAgendada.js';
import { gravarTravaDoWorker } from './gravarTravaDoWorker.js';
import { iniciarWorker } from './iniciarWorker.js';
import { passadaDoWorker } from './passadaDoWorker.js';
import { processoVivo } from './processoVivo.js';

/** A trava só está viva quando o processo existe e o último batimento é recente. */
function estadoDaTravaDoWorker(base?: string, agora = new Date()) {
  const trava = lerTravaDoWorker(base);
  if (!trava || !trava.ativo) {
    return { vivo: false, pid: null as number | null, ultimoBatimento: trava?.batimento ?? null };
  }

  const fresco = agora.getTime() - Date.parse(trava.batimento) < 60000;
  return {
    vivo: fresco && processoVivo(trava.pid),
    pid: trava.pid,
    ultimoBatimento: trava.batimento
  };
}

/** Situação exibida na janela e no ícone da bandeja. */
function estadoDoWorker(estado: EstadoDoWorker) {
  const rotinas = listarRotinas(estado.base);
  const trabalhos = listarTrabalhos(estado.base);
  const instante = estado.agora().getTime();

  const proximas = rotinas
    .filter(rotina => rotina.estado === 'ATIVA')
    .map(rotina => proximoHorario(rotina, instante))
    .filter((horario): horario is number => horario !== null);

  return {
    executando: estado.ativo,
    pausado: agendaPausada(estado.base),
    trava: estadoDaTravaDoWorker(estado.base, estado.agora()),
    pendentes: trabalhos.filter(trabalho => trabalho.estado === 'PENDENTE').length,
    emExecucao: trabalhos.find(trabalho => trabalho.estado === 'EXECUTANDO')?.id ?? null,
    proximaExecucao: proximas.length
      ? new Date(Math.min(...proximas)).toISOString()
      : null,
    rotinasAtivas: rotinas.filter(rotina => rotina.estado === 'ATIVA').length,
    rotinasPausadas: rotinas.filter(rotina => rotina.estado === 'PAUSADA').length,
    ultimoErro: estado.ultimoErro
  };
}

/** Cria um estado limpo para cada instância do worker. */
function criarEstadoDoWorker(deps: DepsWorker): EstadoDoWorker {
  return {
    instancia: randomUUID(),
    d: deps,
    base: deps.base,
    agora: deps.agora ?? (() => new Date()),
    intervalo: deps.intervaloMs ?? 5000,
    temporizador: null,
    ativo: false,
    emTick: false,
    abort: new AbortController(),
    atual: null,
    ultimoErro: null,
    emitidos: new Map(),
    processando: false
  };
}

/** A execução manual entra na mesma fila, sem ignorar as regras de autorização. */
function executarRotinaAgora(estado: EstadoDoWorker, rotinaId: string) {
  const rotina = obterRotina(rotinaId, estado.base);
  const agora = estado.agora();

  return enfileirar({
    chave: `${rotina.id}@manual-${randomUUID()}`,
    rotinaId: rotina.id,
    espacoId: rotina.espacoId,
    tipo: rotina.tipo,
    capability: capacidadeDaRotinaAgendada(rotina),
    ambiente: rotina.ambiente,
    ticket: rotina.ticket,
    origem: 'MANUAL',
    slot: null
  }, estado.base, agora).trabalho;
}

/** Cancela a execução e libera a trava somente depois de aguardar a tarefa atual. */
async function pararWorker(estado: EstadoDoWorker, esperaMs = 15000) {
  if (!estado.ativo) return;

  estado.ativo = false;
  if (estado.temporizador) clearTimeout(estado.temporizador);
  estado.abort.abort();

  if (estado.atual) {
    await Promise.race([
      estado.atual.catch(() => { /* falha já registrada no worker */ }),
      new Promise(resolve => setTimeout(resolve, esperaMs).unref())
    ]);
  }

  gravarTravaDoWorker(estado, false);
}

/** Interface do worker; cada método representa uma ação compreensível da agenda. */
export class Worker {
  private readonly e;

  constructor(deps: DepsWorker = {}) {
    this.e = criarEstadoDoWorker(deps);
  }

  get instancia() { return this.e.instancia; }
  get executando() { return this.e.ativo; }

  iniciar() { iniciarWorker(this.e); }
  parar(esperaMs = 15000) { return pararWorker(this.e, esperaMs); }
  tick() { return passadaDoWorker(this.e); }
  executarAgora(rotinaId: string) { return executarRotinaAgora(this.e, rotinaId); }
  estado() { return estadoDoWorker(this.e); }
}
