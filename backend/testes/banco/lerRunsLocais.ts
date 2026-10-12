/** Lê as runs locais gravadas em runs-qase.json. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { Registro, registro } from '../tipos/runLocal.js';

export const lerRunsLocais = (b?: string) => lerLocal<Registro>('runs-qase.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
