/** Caminho do arquivo vinculos.json, a lista de pastas de projeto vinculadas neste computador. */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const arquivoDePastasVinculadas = (base?: string) => path.join(diretorioDados(base), 'vinculos.json');
