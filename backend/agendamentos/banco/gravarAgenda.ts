/** Grava as rotinas agendadas e a pausa geral (agenda.json). */
import { Registro, registro } from '../tipos/rotina.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export const gravarAgenda = (r: Registro, base?: string) => gravarLocal('agenda.json', registro.parse(r), base);
