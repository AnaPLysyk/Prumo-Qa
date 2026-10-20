/** Consulta e grava o aprendizado dos agentes e o vocabulário aprovado. */
import { comBancoDeConhecimento } from "./comBancoDeConhecimento.js";
import { validarAgenteDoConhecimento, falharConhecimento } from "./baseDoConhecimento.js";
import { termosDaFrase } from "../regras/normalizacaoDoConhecimento.js";
import { limitesConhecimento, Conhecimento, EstadoConhecimento, Linha } from "../tipos/conhecimento.js";
import { linhaParaConhecimento } from "./formatosDoConhecimento.js";
import { semAcentos } from "../../compartilhado/texto.js";

export function aprenderTermos(agente: string, frase: string, base?: string, agora = new Date()) {
  validarAgenteDoConhecimento(agente); const ts = termosDaFrase(frase); if (!ts.length) return { termos: [] as string[] };
  return comBancoDeConhecimento(base, (db) => {
    const up = db.prepare('INSERT INTO vocabulario (termo, agente_id, peso, ultima_em) VALUES (?, ?, 1, ?) ON CONFLICT(termo, agente_id) DO UPDATE SET peso = MIN(peso + 1, 5), ultima_em = excluded.ultima_em');
    for (const t of ts) up.run(t, agente, agora.toISOString());
    db.prepare(`DELETE FROM vocabulario WHERE rowid NOT IN (SELECT rowid FROM vocabulario ORDER BY ultima_em DESC LIMIT ${limitesConhecimento.vocabulario})`).run();
    return { termos: ts };
  });
}

/** Aprovar ou descartar é ato da pessoa (janela ou chip do chat). */
export function decidirConhecimento(id: string, estado: Exclude<EstadoConhecimento, 'RASCUNHO'>, base?: string, agora = new Date()): Conhecimento {
  if (!['APROVADO', 'DESCARTADO'].includes(estado)) falharConhecimento('KNOWLEDGE_STATE_INVALID');
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('UPDATE conhecimentos SET estado = ?, decidido_em = ? WHERE id = ?').run(estado, agora.toISOString(), id); if (!r.changes) falharConhecimento('KNOWLEDGE_NOT_FOUND');
    return linhaParaConhecimento(db.prepare('SELECT * FROM conhecimentos WHERE id = ?').get(id) as Linha); });
}

export function esquecerTermo(agente: string, termo: string, base?: string) { validarAgenteDoConhecimento(agente); return comBancoDeConhecimento(base, (db) => ({ apagado: db.prepare('DELETE FROM vocabulario WHERE agente_id = ? AND termo = ?').run(agente, semAcentos(termo).slice(0, 60)).changes > 0 })); }

/** Pontos por agente para os termos da pergunta (peso aprendido, no máximo 5 por termo). */
export function pesosAprendidos(frase: string, base?: string): Record<string, number> {
  const ts = termosDaFrase(frase); if (!ts.length) return {};
  try { return comBancoDeConhecimento(base, (db) => { const r: Record<string, number> = {}; for (const x of db.prepare(`SELECT agente_id, SUM(peso) AS p FROM vocabulario WHERE termo IN (${ts.map(() => '?').join(',')}) GROUP BY agente_id`).all(...ts) as Linha[]) r[String(x.agente_id)] = Number(x.p); return r; }); }
  catch { return {}; }
}

export function vocabularioDoAgente(agente: string, base?: string) { validarAgenteDoConhecimento(agente); return comBancoDeConhecimento(base, (db) => (db.prepare('SELECT termo, peso, ultima_em FROM vocabulario WHERE agente_id = ? ORDER BY peso DESC, ultima_em DESC LIMIT 60').all(agente) as Linha[]).map((x) => ({ termo: String(x.termo), peso: Number(x.peso), ultimaEm: String(x.ultima_em) }))); }
