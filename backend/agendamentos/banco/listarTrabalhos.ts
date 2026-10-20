/** Lista todos os trabalhos da fila. */
import { lerFila } from './armazenamentoDaFila.js';

export const listarTrabalhos = (base?: string) => lerFila(base).trabalhos;
