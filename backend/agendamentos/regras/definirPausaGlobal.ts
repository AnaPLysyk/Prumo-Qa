/** Pausa ou retoma todos os agendamentos de uma vez. */
import { gravarAgenda } from '../banco/gravarAgenda.js';
import { lerAgenda } from '../banco/lerAgenda.js';

export function definirPausaGlobal(pausado: boolean, base?: string) { const reg = lerAgenda(base); reg.pausaGlobal = pausado; gravarAgenda(reg, base); return pausado; }
