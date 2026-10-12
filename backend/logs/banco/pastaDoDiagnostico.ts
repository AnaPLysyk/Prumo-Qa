/** Pasta do diagnóstico da janela (LOCALAPPDATA\PrumoQA\diagnostico). */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';

export const pastaDoDiagnostico = (base?: string) => path.join(diretorioDados(base), 'diagnostico');
