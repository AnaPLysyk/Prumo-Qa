/** Lê as autorizações de execução e as políticas de publicação (autorizacoes.json). */
import { z } from 'zod';
import { Registro, registro } from '../tipos/autorizacoes.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerAutorizacoes = (base?: string): Registro => lerLocal<Registro>('autorizacoes.json', registro as unknown as z.ZodType<Registro>, { version: 1, execucoes: [], publicacoes: [], escritas: [] }, base);
