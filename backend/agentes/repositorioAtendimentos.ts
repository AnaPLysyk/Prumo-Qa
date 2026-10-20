/** Registra, lista e avalia atendimentos, com isolamento por conta e projeto. */
import { comBancoDeConhecimento } from "./banco/comBancoDeConhecimento.js";
import { falharConhecimento, validarAgenteDoConhecimento, validarProjetoDoConhecimento } from "./banco/validacoesDoConhecimento.js";
import { pessoaDoConhecimento } from "./banco/pessoaDoConhecimento.js";
import { Atendimento, Linha, limitesConhecimento } from "./tipos/conhecimento.js";

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
