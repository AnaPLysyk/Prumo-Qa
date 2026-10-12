/** Calcula quanto tempo um trabalho levou (ou nada se não terminou). */
import { Trabalho } from '../../agendamentos/tipos/fila.js';

export const duracaoDoTrabalho = (t: Trabalho) => t.iniciadoEm && t.terminadoEm ? Math.max(0, Date.parse(t.terminadoEm) - Date.parse(t.iniciadoEm)) : null;
