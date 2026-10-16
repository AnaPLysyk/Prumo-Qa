/** De quem é o perfil e o histórico de atendimentos: a conta da sessão do Prumo. Sem sessão (MCP, worker, linha de comando), ninguém: nada pessoal é lido nem gravado. */
import { contaDaSessao } from '../../login/regras/sessao.js';

export function pessoaDoConhecimento(base?: string): string | null {
  try { return contaDaSessao(base)?.id ?? null; } catch { return null; }
}
