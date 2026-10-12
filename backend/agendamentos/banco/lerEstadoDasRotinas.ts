/** Lê o estado de execução de cada rotina (agenda-estado.json). */
import { EstadoRot, estadoRot } from '../tipos/worker.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerEstadoDasRotinas = (b?: string): EstadoRot => lerLocal<EstadoRot>('agenda-estado.json', estadoRot, { version: 1, itens: {} }, b);
