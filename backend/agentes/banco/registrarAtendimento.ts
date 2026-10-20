/** Registra um atendimento do chat (agente, modo e fontes) em nome da pessoa da sessão, sem a pergunta nem a resposta. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';
import { validarAgenteDoConhecimento } from './validacoesDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validacoesDoConhecimento.js';
import { limitesConhecimento } from '../tipos/conhecimento.js';

export function registrarAtendimento(a: { espacoId: string | null; agente: string; modo: 'LOCAL' | 'CLAUDE' | 'CODEX'; fontes: string[] }, base?: string, agora = new Date()): number {
  validarProjetoDoConhecimento(a.espacoId); validarAgenteDoConhecimento(a.agente);
  const pessoa = pessoaDoConhecimento(base);
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('INSERT INTO atendimentos (em, espaco_id, agente_id, modo, fontes, usuario_id) VALUES (?, ?, ?, ?, ?, ?)').run(agora.toISOString(), a.espacoId, a.agente, a.modo, JSON.stringify(a.fontes.slice(0, 10).map((f) => String(f).slice(0, 40))), pessoa);
    db.prepare(`DELETE FROM atendimentos WHERE id NOT IN (SELECT id FROM atendimentos ORDER BY id DESC LIMIT ${limitesConhecimento.atendimentos})`).run(); return Number(r.lastInsertRowid); });
}
