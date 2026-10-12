/** Grava o estado de execução de cada rotina (agenda-estado.json). */
import { EstadoRot, estadoRot } from '../tipos/worker.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export const gravarEstadoDasRotinas = (e: EstadoRot, b?: string) => gravarLocal('agenda-estado.json', estadoRot.parse(e), b);
