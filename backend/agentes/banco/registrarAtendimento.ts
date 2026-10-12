/** Registra um atendimento do chat (agente, modo e fontes), sem a pergunta nem a resposta. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { validarAgenteDoConhecimento } from './validarAgenteDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validarProjetoDoConhecimento.js';
import { limitesConhecimento } from '../tipos/conhecimento.js';

// ---------------- Atendimentos: metadados, sem texto ----------------
export function registrarAtendimento(a: { espacoId: string | null; agente: string; modo: 'LOCAL' | 'CLAUDE' | 'CODEX'; fontes: string[] }, base?: string, agora = new Date()): number {
  validarProjetoDoConhecimento(a.espacoId); validarAgenteDoConhecimento(a.agente);
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('INSERT INTO atendimentos (em, espaco_id, agente_id, modo, fontes) VALUES (?, ?, ?, ?, ?)').run(agora.toISOString(), a.espacoId, a.agente, a.modo, JSON.stringify(a.fontes.slice(0, 10).map((f) => String(f).slice(0, 40))));
    db.prepare(`DELETE FROM atendimentos WHERE id NOT IN (SELECT id FROM atendimentos ORDER BY id DESC LIMIT ${limitesConhecimento.atendimentos})`).run(); return Number(r.lastInsertRowid); });
}
