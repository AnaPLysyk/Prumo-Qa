/** Worker: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { enfileirar, registrarPerdido, pegarProximoTrabalho, recuperarInterrompidos, listarTrabalhos } from "../banco/fila.js";
import { listarRotinas, agendaPausada, obterRotina } from "../banco/agenda.js";
import { horariosVencidos, marcarHorarioTratado, proximoHorario } from "../regras/cicloDaRotina.js";
import { EstadoDoWorker, DepsWorker } from "../tipos/worker.js";
import { capacidadeDaRotinaAgendada, emitirEventoDoWorker } from "./apoioDoWorker.js";
import { gravarTravaDoWorker, lerTravaDoWorker, processoVivo } from "./apoioDoWorker.js";
import { processarTrabalho, repetirPublicacoesPendentes } from "./processarTrabalho.js";
import { randomUUID } from "node:crypto";

// --- passadaDoWorker ---
// enfileirarHorariosVencidos — responsabilidade deste trecho
export function enfileirarHorariosVencidos(e: EstadoDoWorker, agora: Date) {
  for (const r of listarRotinas(e.base)) {
    if (r.estado !== 'ATIVA') continue;
    for (const v of horariosVencidos(r, agora.getTime())) {
      const iso = new Date(v.slot).toISOString();
      const n = { chave: `${r.id}@${iso}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: capacidadeDaRotinaAgendada(r), ambiente: r.ambiente, ticket: r.ticket, origem: 'AGENDA' as const, slot: iso };
      if (v.executar) {
        try { enfileirar(n, e.base, agora); }
        catch (erro) { if ((erro as Error).message === 'QUEUE_ALREADY_ACTIVE' || (erro as Error).message === 'QUEUE_FULL') registrarPerdido(n, 'Pulado: a execução anterior desta rotina ainda estava ativa ou a fila estava cheia.', e.base, agora); else throw erro; }
      } else registrarPerdido(n, v.motivo === 'SUBSTITUIDO' ? 'Horário substituído por um mais recente (política: executar uma vez).' : 'Horário perdido: o Prumo estava fechado, o computador desligado/suspenso ou o atraso passou da tolerância. Nada foi executado.', e.base, agora);
      marcarHorarioTratado(r.id, v.slot, e.base);
    }
  }
}

// passadaDoWorker — responsabilidade deste trecho
export async function passadaDoWorker(e: EstadoDoWorker) {
  if (e.emTick) return; e.emTick = true;
  try {
    const agora = e.agora(); if (e.ativo) gravarTravaDoWorker(e, true);
    if (!agendaPausada(e.base)) enfileirarHorariosVencidos(e, agora);
    if (e.ativo && !agendaPausada(e.base)) {
      const pausadas = new Set(listarRotinas(e.base).filter(r => r.estado !== 'ATIVA').map(r => r.id));
      const t = pegarProximoTrabalho(e.base, e.agora(), x => x.origem === 'AGENDA' && pausadas.has(x.rotinaId));
      if (t) await processarTrabalho(e, t);
    }
    if (e.ativo && !agendaPausada(e.base)) await repetirPublicacoesPendentes(e);
  } finally { e.emTick = false; }
}

// --- Worker ---
// iniciarWorker — responsabilidade deste trecho
function agendarProximaPassada(e: EstadoDoWorker, ms: number) {
  if (!e.ativo || e.d.semTemporizador) return;
  e.temporizador = setTimeout(() => {
    e.atual = passadaDoWorker(e).catch(erro => { e.ultimoErro = (erro as Error).message.slice(0, 120); }).finally(() => agendarProximaPassada(e, e.intervalo));
  }, ms);
  e.temporizador.unref?.();
}

/** Assume a trava ou recusa. Dois workers sobre a mesma agenda nunca coexistem. */
export function iniciarWorker(e: EstadoDoWorker) {
  const agora = e.agora(); const t = lerTravaDoWorker(e.base);
  if (t?.ativo && t.instancia !== e.instancia && agora.getTime() - Date.parse(t.batimento) < 60000 && processoVivo(t.pid) && t.pid !== process.pid) throw new Error('WORKER_ALREADY_RUNNING');
  if (e.ativo) return;
  e.abort = new AbortController(); e.ativo = true; gravarTravaDoWorker(e, true);
  // Com a trava assumida, nenhum outro worker está vivo: todo EXECUTANDO que não é desta instância foi interrompido,
  // mesmo com batimento recente (queda e reabertura em menos de 2 min travariam a fila inteira). Só um trabalho ainda
  // em curso neste processo (parar() que esgotou a espera) mantém a tolerância por batimento.
  const recuperados = recuperarInterrompidos(e.base, agora, e.processando ? 120000 : 0);
  if (recuperados) emitirEventoDoWorker(e, 'WORKER_INTERROMPIDO', '', '', 'Execuções interrompidas recuperadas', `${recuperados} trabalho(s) estavam em andamento quando o Prumo foi encerrado; o histórico foi preservado.`);
  agendarProximaPassada(e, 0);
}

// Worker — responsabilidade deste trecho
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
