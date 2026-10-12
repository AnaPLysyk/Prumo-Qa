/** Lista todas as rotinas agendadas. */
import { lerAgenda } from './lerAgenda.js';

export const listarRotinas = (base?: string) => lerAgenda(base).rotinas;
