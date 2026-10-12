/** Soma, por agente, o peso dos termos aprendidos que aparecem na frase. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { termosDaFrase } from '../regras/termosDaFrase.js';
import { Linha } from '../tipos/conhecimento.js';

/** Pontos por agente para os termos da pergunta (peso aprendido, no máximo 5 por termo). */
export function pesosAprendidos(frase: string, base?: string): Record<string, number> {
  const ts = termosDaFrase(frase); if (!ts.length) return {};
  try { return comBancoDeConhecimento(base, (db) => { const r: Record<string, number> = {}; for (const x of db.prepare(`SELECT agente_id, SUM(peso) AS p FROM vocabulario WHERE termo IN (${ts.map(() => '?').join(',')}) GROUP BY agente_id`).all(...ts) as Linha[]) r[String(x.agente_id)] = Number(x.p); return r; }); }
  catch { return {}; }
}
