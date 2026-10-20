/** Worker de agendamentos: a cada ciclo coloca na fila os horários vencidos, executa um trabalho por vez com batimento, registra o resultado e publica quando há política aprovada. */
import { DepsWorker } from '../tipos/worker.js';

import { estadoDoWorker } from './estadoDoWorker.js';

import { iniciarWorker } from './iniciarWorker.js';
import { passadaDoWorker } from './passadaDoWorker.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { gravarTravaDoWorker } from './gravarTravaDoWorker.js';
import { randomUUID } from 'node:crypto';
import { enfileirar } from '../banco/enfileirar.js';
import { obterRotina } from '../banco/obterRotina.js';
import { capacidadeDaRotinaAgendada } from './capacidadeDaRotinaAgendada.js';

function criarEstadoDoWorker(d: DepsWorker): EstadoDoWorker {
  return {
    instancia: randomUUID(), d, base: d.base, agora: d.agora ?? (() => new Date()), intervalo: d.intervaloMs ?? 5000,
    temporizador: null, ativo: false, emTick: false, abort: new AbortController(), atual: null, ultimoErro: null, emitidos: new Map(), processando: false,
  };
}


function executarRotinaAgora(e: EstadoDoWorker, rotinaId: string) {
  const r = obterRotina(rotinaId, e.base); const agora = e.agora();
  return enfileirar({ chave: `${r.id}@manual-${randomUUID()}`, rotinaId: r.id, espacoId: r.espacoId, tipo: r.tipo, capability: capacidadeDaRotinaAgendada(r), ambiente: r.ambiente, ticket: r.ticket, origem: 'MANUAL', slot: null }, e.base, agora).trabalho;
}


async function pararWorker(e: EstadoDoWorker, esperaMs = 15000) {
  if (!e.ativo) return; e.ativo = false; if (e.temporizador) clearTimeout(e.temporizador); e.abort.abort();
  if (e.atual) await Promise.race([e.atual.catch(() => { /* já registrado */ }), new Promise(r => setTimeout(r, esperaMs).unref())]);
  gravarTravaDoWorker(e, false);
}



// Cada método só chama o arquivo que faz o trabalho; o estado do worker fica em this.e (veja tipos/worker.ts).
export class Worker {
  private readonly e;
  constructor(d: DepsWorker = {}) { this.e = criarEstadoDoWorker(d); }
  get instancia() { return this.e.instancia; }
  get executando() { return this.e.ativo; }
  iniciar() { iniciarWorker(this.e); }
  parar(esperaMs = 15000) { return pararWorker(this.e, esperaMs); }
  tick() { return passadaDoWorker(this.e); }
  executarAgora(rotinaId: string) { return executarRotinaAgora(this.e, rotinaId); }
  estado() { return estadoDoWorker(this.e); }
}
