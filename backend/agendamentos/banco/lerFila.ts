/** Lê a fila de trabalhos (fila.json). */
import { z } from 'zod';
import { Registro, registro } from '../tipos/fila.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerFila = (base?: string): Registro => lerLocal<Registro>('fila.json', registro as unknown as z.ZodType<Registro>, { version: 1, trabalhos: [] }, base);
