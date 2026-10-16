/** Lê o perfil da pessoa da sessão: como chamar, papel, experiência, foco e se pode ser compartilhado com a IA externa. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';
import { Linha, Perfil } from '../tipos/conhecimento.js';
import { Experiencia, Papel } from '../tipos/persona.js';

const vazio: Perfil = { comoChamar: null, papel: null, experiencia: null, foco: null, compartilharComIa: false, atualizadoEm: null };

// ---------------- Perfil (2.17: uma linha por conta; sem sessão, perfil vazio) ----------------
export function lerPerfil(base?: string): Perfil {
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) return { ...vazio };
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT como_chamar, papel, experiencia, foco, compartilhar_ia, atualizado_em FROM perfis WHERE usuario_id = ?').get(pessoa) as Linha | undefined;
    return { comoChamar: (r?.como_chamar as string | null) ?? null, papel: (r?.papel as Papel | null) ?? null, experiencia: (r?.experiencia as Experiencia | null) ?? null, foco: (r?.foco as string | null) ?? null,
      compartilharComIa: Number(r?.compartilhar_ia ?? 0) === 1, atualizadoEm: (r?.atualizado_em as string | null) ?? null }; });
}
