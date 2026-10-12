/** Lê como a pessoa quer ser chamada e o papel dela. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { Linha, Perfil } from '../tipos/conhecimento.js';
import { Papel } from '../tipos/persona.js';

// ---------------- Perfil (uma linha: este computador = esta pessoa) ----------------
export function lerPerfil(base?: string): Perfil {
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT como_chamar, papel, atualizado_em FROM perfil WHERE id = 1').get() as Linha | undefined;
    return { comoChamar: (r?.como_chamar as string | null) ?? null, papel: (r?.papel as Papel | null) ?? null, atualizadoEm: (r?.atualizado_em as string | null) ?? null }; });
}
