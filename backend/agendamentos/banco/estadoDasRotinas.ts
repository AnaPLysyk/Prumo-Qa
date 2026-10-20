/** Lê e grava o estado de execução das rotinas no armazenamento local. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { EstadoRot, estadoRot } from '../tipos/worker.js';

export const lerEstadoDasRotinas = (base?: string): EstadoRot =>
  lerLocal<EstadoRot>(
    'agenda-estado.json',
    estadoRot,
    { version: 1, itens: {} },
    base
  );

export const gravarEstadoDasRotinas = (estado: EstadoRot, base?: string) =>
  gravarLocal('agenda-estado.json', estadoRot.parse(estado), base);
