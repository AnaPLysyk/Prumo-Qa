/** Calcula a impressão digital SHA-256 de um texto ou arquivo, usada para detectar alterações. */
import { createHash } from 'node:crypto';

export const hash = (valor: string | Buffer) => createHash('sha256').update(valor).digest('hex');
