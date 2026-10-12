/** Ensina a um agente os termos de uma pergunta que deveria ter ido para ele. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { validarAgenteDoConhecimento } from './validarAgenteDoConhecimento.js';
import { termosDaFrase } from '../regras/termosDaFrase.js';
import { limitesConhecimento } from '../tipos/conhecimento.js';

// ---------------- Vocabulário aprendido com as correções da pessoa ----------------
export function aprenderTermos(agente: string, frase: string, base?: string, agora = new Date()) {
  validarAgenteDoConhecimento(agente); const ts = termosDaFrase(frase); if (!ts.length) return { termos: [] as string[] };
  return comBancoDeConhecimento(base, (db) => {
    const up = db.prepare('INSERT INTO vocabulario (termo, agente_id, peso, ultima_em) VALUES (?, ?, 1, ?) ON CONFLICT(termo, agente_id) DO UPDATE SET peso = MIN(peso + 1, 5), ultima_em = excluded.ultima_em');
    for (const t of ts) up.run(t, agente, agora.toISOString());
    db.prepare(`DELETE FROM vocabulario WHERE rowid NOT IN (SELECT rowid FROM vocabulario ORDER BY ultima_em DESC LIMIT ${limitesConhecimento.vocabulario})`).run();
    return { termos: ts };
  });
}
