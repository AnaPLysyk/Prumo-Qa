/** Aprova ou descarta um trecho de Skill. Aprovar é sempre ato da pessoa; descartar vale também para os trechos do Prumo. */
import { comBancoDeSkills, linhaParaTrecho } from './comBancoDeSkills.js';
import { EstadoTrecho, TrechoDeSkill } from '../tipos/skills.js';
import { falharCom } from '../../compartilhado/erros.js';

export function decidirTrechoDeSkill(id: string, estado: Exclude<EstadoTrecho, 'RASCUNHO'>, base?: string, agora = new Date()): TrechoDeSkill {
  if (!['APROVADO', 'DESCARTADO'].includes(estado)) falharCom('SKILL_STATE_INVALID');
  return comBancoDeSkills(base, (db) => {
    const r = db.prepare('UPDATE trechos SET estado = ?, decidido_em = ? WHERE id = ?').run(estado, agora.toISOString(), id);
    if (!r.changes) falharCom('SKILL_NOT_FOUND');
    return linhaParaTrecho(db.prepare('SELECT * FROM trechos WHERE id = ?').get(id) as Record<string, unknown>);
  });
}
