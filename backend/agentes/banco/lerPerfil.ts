/** Lê o perfil da pessoa: como chamar, papel, experiência, foco e se pode ser compartilhado com a IA externa. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { Linha, Perfil } from '../tipos/conhecimento.js';
import { Experiencia, Papel } from '../tipos/persona.js';

// ---------------- Perfil (uma linha: este computador = esta pessoa) ----------------
export function lerPerfil(base?: string): Perfil {
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT como_chamar, papel, experiencia, foco, compartilhar_ia, atualizado_em FROM perfil WHERE id = 1').get() as Linha | undefined;
    return { comoChamar: (r?.como_chamar as string | null) ?? null, papel: (r?.papel as Papel | null) ?? null, experiencia: (r?.experiencia as Experiencia | null) ?? null, foco: (r?.foco as string | null) ?? null,
      compartilharComIa: Number(r?.compartilhar_ia ?? 0) === 1, atualizadoEm: (r?.atualizado_em as string | null) ?? null }; });
}
