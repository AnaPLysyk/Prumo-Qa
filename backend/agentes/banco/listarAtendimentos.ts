/** Lista os atendimentos da pessoa da sessão num projeto e agente; sem sessão, nenhum. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';
import { validarAgenteDoConhecimento } from './validacoesDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validacoesDoConhecimento.js';
import { Atendimento, Linha } from '../tipos/conhecimento.js';

export function listarAtendimentos(espacoId: string | null, agente?: string | null, limite = 40, base?: string): Atendimento[] {
  validarProjetoDoConhecimento(espacoId); validarAgenteDoConhecimento(agente);
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) return [];
  return comBancoDeConhecimento(base, (db) => (db.prepare(`SELECT * FROM atendimentos WHERE usuario_id = ? AND ${espacoId ? 'espaco_id = ?' : 'espaco_id IS NULL'}${agente ? ' AND agente_id = ?' : ''} ORDER BY id DESC LIMIT ?`).all(...[pessoa, ...(espacoId ? [espacoId] : []), ...(agente ? [agente] : []), Math.min(500, limite)]) as Linha[])
    .map((r) => ({ id: Number(r.id), em: String(r.em), agente: String(r.agente_id), modo: String(r.modo), fontes: (() => { try { return JSON.parse(String(r.fontes)) as string[]; } catch { return []; } })(), avaliacao: (r.avaliacao as string | null) ?? null })));
}
