/** Diz se um caminho fica dentro de outra pasta. */
import path from 'node:path';

export function caminhoDentroDe(raiz:string,alvo:string) { const r=path.relative(raiz,alvo);return !r || (r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r)); }
