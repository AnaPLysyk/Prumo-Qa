/** Diz qual comando do projeto (capacidade) o trabalho da rotina vai usar: o escolhido na rotina ou o do script k6. */
import { capacidadeDoK6 } from '../k6/capacidadeDoK6.js';
import { Rotina } from '../tipos/rotina.js';

export function capacidadeDaRotinaAgendada(r: Rotina) {
  return r.capability ?? (r.k6 ? capacidadeDoK6(r.k6) : undefined);
}
