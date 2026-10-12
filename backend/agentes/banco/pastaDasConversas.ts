/** Pasta das conversas antigas do chat. */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const pastaDasConversas = (base?: string) => path.join(diretorioDados(base), 'conversas');
