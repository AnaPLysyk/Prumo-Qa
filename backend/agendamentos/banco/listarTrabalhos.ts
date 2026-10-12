/** Lista todos os trabalhos da fila. */
import { lerFila } from './lerFila.js';

export const listarTrabalhos = (base?: string) => lerFila(base).trabalhos;
