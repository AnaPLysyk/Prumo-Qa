/** Recusa caminhos absolutos, com "..", unidades de disco ou caracteres de controle: o caminho tem de ficar dentro da pasta do projeto. */
import path from 'node:path';
import { ErroQa } from '../erros.js';

export function validarRelativo(p: string) {
  if (path.isAbsolute(p) || /^[a-z]:/i.test(p) || p.startsWith('\\') || p.split(/[\\/]/).includes('..') || /[:\x00-\x1f]/.test(p))
    throw new ErroQa('PATH_FORBIDDEN', 'Caminho deve ser relativo e permanecer na raiz.');
}
