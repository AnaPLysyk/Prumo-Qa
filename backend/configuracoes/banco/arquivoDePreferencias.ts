/** Caminho de preferencias.json na pasta de dados. */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const arquivoDePreferencias = (base?: string) => path.join(diretorioDados(base), 'preferencias.json');
