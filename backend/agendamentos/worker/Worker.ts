/** Worker de agendamentos: a cada ciclo coloca na fila os horários vencidos, executa um trabalho por vez com batimento, registra o resultado e publica quando há política aprovada. */
import { DepsWorker } from '../tipos/worker.js';
import { criarEstadoDoWorker } from './criarEstadoDoWorker.js';
import { estadoDoWorker } from './estadoDoWorker.js';
import { executarRotinaAgora } from './executarRotinaAgora.js';
import { iniciarWorker } from './iniciarWorker.js';
import { passadaDoWorker } from './passadaDoWorker.js';
import { pararWorker } from './pararWorker.js';

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
