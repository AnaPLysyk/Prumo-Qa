/** Nome e papel de acesso da conta logada (login local), para a IA saber com quem fala; sem login, nada. */
import { situacaoDaSessao } from '../../login/regras/sessao.js';

export function contaParaIa(base?: string): { nome: string; acesso: string } | null {
  try { const s = situacaoDaSessao(base, Date.now(), false); return s.tipo === 'ATIVA' ? { nome: s.usuario.nome, acesso: s.papel?.nome ?? s.usuario.papel } : null; } catch { return null; }
}
