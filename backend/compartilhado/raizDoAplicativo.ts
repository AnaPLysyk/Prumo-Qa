/** Pasta raiz do aplicativo instalado. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const raizDoAplicativo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
