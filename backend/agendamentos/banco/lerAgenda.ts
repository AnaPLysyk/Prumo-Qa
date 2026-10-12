/** Lê as rotinas agendadas e a pausa geral (agenda.json). */
import { z } from 'zod';
import { Registro, registro } from '../tipos/rotina.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

// ---- Persistência ----
export const lerAgenda = (base?: string): Registro => lerLocal<Registro>('agenda.json', registro as unknown as z.ZodType<Registro>, { version: 1, pausaGlobal: false, rotinas: [] }, base);
