/** Caminho do banco de conhecimento conhecimento.db na pasta de dados. */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const caminhoConhecimento = (base?: string) => path.join(diretorioDados(base), 'conhecimento.db');
