/** Lê o registro das publicações de comentário no Jira (publicacoes-jira.json). */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { Registro, registro } from '../tipos/comentarioJira.js';

export const lerPublicacoesJira = (b?: string): Registro => lerLocal<Registro>('publicacoes-jira.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
