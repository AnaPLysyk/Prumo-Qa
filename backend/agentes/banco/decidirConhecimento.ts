/** Aprova ou descarta um conhecimento. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './falharConhecimento.js';
import { linhaParaConhecimento } from './linhaParaConhecimento.js';
import { Conhecimento, EstadoConhecimento, Linha } from '../tipos/conhecimento.js';

/** Aprovar ou descartar é ato da pessoa (janela ou chip do chat). */
export function decidirConhecimento(id: string, estado: Exclude<EstadoConhecimento, 'RASCUNHO'>, base?: string, agora = new Date()): Conhecimento {
  if (!['APROVADO', 'DESCARTADO'].includes(estado)) falharConhecimento('KNOWLEDGE_STATE_INVALID');
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('UPDATE conhecimentos SET estado = ?, decidido_em = ? WHERE id = ?').run(estado, agora.toISOString(), id); if (!r.changes) falharConhecimento('KNOWLEDGE_NOT_FOUND');
    return linhaParaConhecimento(db.prepare('SELECT * FROM conhecimentos WHERE id = ?').get(id) as Linha); });
}
