/** Diz se dois caminhos absolutos apontam para o mesmo lugar. */
import path from 'node:path';
import { caminhoNormalizado } from './caminhoNormalizado.js';

export const mesmoCaminho = (a: unknown, b: string) => typeof a === 'string' && path.isAbsolute(a) && caminhoNormalizado(a) === caminhoNormalizado(b);
