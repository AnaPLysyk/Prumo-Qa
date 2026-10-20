/** Compara caminhos absolutos, respeitando a diferença entre Windows e sistemas POSIX. */
import path from 'node:path';

const caminhoNormalizado = (caminho: string): string => {
  const absoluto = path.resolve(caminho);
  return process.platform === 'win32' ? absoluto.toLowerCase() : absoluto;
};

export const mesmoCaminho = (a: unknown, b: string): boolean =>
  typeof a === 'string' && path.isAbsolute(a) && caminhoNormalizado(a) === caminhoNormalizado(b);
