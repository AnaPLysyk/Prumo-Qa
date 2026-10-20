/** Apaga um conhecimento ensinado (o inicial do Prumo só pode ser descartado). */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './baseDoConhecimento.js';
import { Linha } from '../tipos/conhecimento.js';

/** Apagar remove de vez; o conhecimento de origem PRUMO só pode ser descartado (volta se a pessoa reaprovar). */
export function apagarConhecimento(id: string, base?: string) {
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT origem FROM conhecimentos WHERE id = ?').get(id) as Linha | undefined; if (!r) falharConhecimento('KNOWLEDGE_NOT_FOUND'); if (r.origem === 'PRUMO') falharConhecimento('KNOWLEDGE_BUILTIN');
    db.prepare('DELETE FROM conhecimentos WHERE id = ?').run(id); return { apagado: true }; });
}
