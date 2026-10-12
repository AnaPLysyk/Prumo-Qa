/** Diz se todos os agendamentos estão pausados. */
import { lerAgenda } from './lerAgenda.js';

export const agendaPausada = (base?: string) => lerAgenda(base).pausaGlobal;
