/** Cria o estado inicial de um worker: identidade própria, relógio, pasta de dados e intervalo entre passadas (5 s por padrão). */
import { randomUUID } from 'node:crypto';
import { DepsWorker, EstadoDoWorker } from '../tipos/worker.js';

export function criarEstadoDoWorker(d: DepsWorker): EstadoDoWorker {
  return {
    instancia: randomUUID(), d, base: d.base, agora: d.agora ?? (() => new Date()), intervalo: d.intervaloMs ?? 5000,
    temporizador: null, ativo: false, emTick: false, abort: new AbortController(), atual: null, ultimoErro: null, emitidos: new Map(), processando: false,
  };
}
