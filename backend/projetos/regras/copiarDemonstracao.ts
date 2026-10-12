/** Copia o projeto de demonstração para a pasta de dados do usuário (sem sobrescrever) para poder vinculá-lo. */
import fs from 'node:fs';
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

/** Copia o projeto de demonstração para uma pasta gravável (a instalação é somente leitura). */
export function copiarDemonstracao(origem: string, base?: string) {
  const destino = path.join(diretorioDados(base), 'demonstracao');
  if (fs.existsSync(destino)) return destino; // nunca sobrescreve
  fs.cpSync(origem, destino, { recursive: true, filter: s => !/[\\/]\.prumo([\\/]|$)/.test(s) && !/[\\/]node_modules([\\/]|$)/.test(s) });
  return destino;
}
