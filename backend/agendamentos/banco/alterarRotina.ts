/** Abre uma rotina, aplica uma alteração, confere e grava. */
import { gravarAgenda } from './gravarAgenda.js';
import { lerAgenda } from './lerAgenda.js';
import { Rotina, rotinaSchema } from '../tipos/rotina.js';

export function alterarRotina(id: string, fn: (r: Rotina) => void, base?: string) {
  const reg = lerAgenda(base); const r = reg.rotinas.find(x => x.id === id); if (!r) throw new Error('SCHEDULE_NOT_FOUND');
  fn(r); rotinaSchema.parse(r); gravarAgenda(reg, base); return r;
}
