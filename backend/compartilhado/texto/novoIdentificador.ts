/** Gera um identificador único novo. */
import { randomUUID } from 'node:crypto';

export const novoIdentificador = () => randomUUID();
