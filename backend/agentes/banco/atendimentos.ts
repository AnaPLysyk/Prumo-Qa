/** Histórico de atendimentos e aprendizados — arquivos relacionados agrupados para manutenção. */
import { comBancoDeConhecimento } from "./comBancoDeConhecimento.js";
import { falharConhecimento, validarAgenteDoConhecimento, validarProjetoDoConhecimento, pessoaDoConhecimento } from "./comBancoDeConhecimento.js";
import { Atendimento, Linha, limitesConhecimento, Conhecimento, EstadoConhecimento } from "../tipos/conhecimento.js";
import { termosDaFrase } from "../regras/normalizacaoDoConhecimento.js";
import { linhaParaConhecimento } from "./comBancoDeConhecimento.js";
import { semAcentos } from "../../compartilhado/texto.js";

// ── atendimentos ──
export function avaliarAtendimento(id: number, avaliacao: 'UTIL' | 'NAO_UTIL', base?: string) {
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) falharConhecimento('ATTENDANCE_NOT_FOUND');
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('UPDATE atendimentos SET avaliacao = ? WHERE id = ? AND usuario_id = ?').run(avaliacao, id, pessoa); if (!r.changes) falharConhecimento('ATTENDANCE_NOT_FOUND'); return { avaliado: true }; });
}

export function listarAtendimentos(espacoId: string | null, agente?: string | null, limite = 40, base?: string): Atendimento[] {
  validarProjetoDoConhecimento(espacoId); validarAgenteDoConhecimento(agente);
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) return [];
  return comBancoDeConhecimento(base, (db) => (db.prepare(`SELECT * FROM atendimentos WHERE usuario_id = ? AND ${espacoId ? 'espaco_id = ?' : 'espaco_id IS NULL'}${agente ? ' AND agente_id = ?' : ''} ORDER BY id DESC LIMIT ?`).all(...[pessoa, ...(espacoId ? [espacoId] : []), ...(agente ? [agente] : []), Math.min(500, limite)]) as Linha[])
    .map((r) => ({ id: Number(r.id), em: String(r.em), agente: String(r.agente_id), modo: String(r.modo), fontes: (() => { try { return JSON.parse(String(r.fontes)) as string[]; } catch { return []; } })(), avaliacao: (r.avaliacao as string | null) ?? null })));
}

export function registrarAtendimento(a: { espacoId: string | null; agente: string; modo: 'LOCAL' | 'CLAUDE' | 'CODEX'; fontes: string[] }, base?: string, agora = new Date()): number {
  validarProjetoDoConhecimento(a.espacoId); validarAgenteDoConhecimento(a.agente);
  const pessoa = pessoaDoConhecimento(base);
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('INSERT INTO atendimentos (em, espaco_id, agente_id, modo, fontes, usuario_id) VALUES (?, ?, ?, ?, ?, ?)').run(agora.toISOString(), a.espacoId, a.agente, a.modo, JSON.stringify(a.fontes.slice(0, 10).map((f) => String(f).slice(0, 40))), pessoa);
    db.prepare(`DELETE FROM atendimentos WHERE id NOT IN (SELECT id FROM atendimentos ORDER BY id DESC LIMIT ${limitesConhecimento.atendimentos})`).run(); return Number(r.lastInsertRowid); });
}

// ── aprendizados ──
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
