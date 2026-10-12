/** Lista os atendimentos de um projeto e agente. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { validarAgenteDoConhecimento } from './validarAgenteDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validarProjetoDoConhecimento.js';
import { Atendimento, Linha } from '../tipos/conhecimento.js';

export function listarAtendimentos(espacoId: string | null, agente?: string | null, limite = 40, base?: string): Atendimento[] {
  validarProjetoDoConhecimento(espacoId); validarAgenteDoConhecimento(agente);
  return comBancoDeConhecimento(base, (db) => (db.prepare(`SELECT * FROM atendimentos WHERE ${espacoId ? 'espaco_id = ?' : 'espaco_id IS NULL'}${agente ? ' AND agente_id = ?' : ''} ORDER BY id DESC LIMIT ?`).all(...[...(espacoId ? [espacoId] : []), ...(agente ? [agente] : []), Math.min(500, limite)]) as Linha[])
    .map((r) => ({ id: Number(r.id), em: String(r.em), agente: String(r.agente_id), modo: String(r.modo), fontes: (() => { try { return JSON.parse(String(r.fontes)) as string[]; } catch { return []; } })(), avaliacao: (r.avaliacao as string | null) ?? null })));
}
