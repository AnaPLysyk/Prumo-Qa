/** Normaliza um caminho de pasta (caminho real, minúsculas) para comparar se duas pastas são a mesma. */
import fs from 'node:fs';

/** Forma canônica para comparar: resolve links, 8.3 (RUNNER~1) e caixa, como o núcleo faz ao carregar o projeto. */
export const caminhoComparavel = (raiz: string) => { try { return fs.realpathSync.native(raiz).toLowerCase(); } catch { return String(raiz).toLowerCase(); } };
