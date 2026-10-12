/** Calcula a chave que impede repetir a mesma operação (projeto + operação + parâmetros). */
import { createHash } from 'node:crypto';
import { textoCanonico } from './textoCanonico.js';

export const chaveDaOperacao = (espacoId: string, operacao: string, parametros: unknown) => createHash('sha256').update(`${espacoId}|${operacao}|${textoCanonico(parametros)}`).digest('hex');
