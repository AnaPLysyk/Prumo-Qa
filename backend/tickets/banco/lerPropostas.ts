/** Lê as propostas de caso e de bug gravadas em propostas.json. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { Registro, registro } from '../tipos/proposta.js';

export const lerPropostas = (b?: string) => lerLocal<Registro>('propostas.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
