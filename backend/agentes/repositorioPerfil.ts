/** Lê e salva o perfil da conta autenticada no armazenamento protegido. */
import { comBancoDeConhecimento } from "./banco/comBancoDeConhecimento.js";
import { pessoaDoConhecimento } from "./banco/pessoaDoConhecimento.js";
import { Linha, Perfil } from "./tipos/conhecimento.js";
import { Experiencia, Papel, experiencias, papeis } from "./tipos/persona.js";
import { falharConhecimento } from "./banco/validacoesDoConhecimento.js";
import { normalizarFoco } from "./regras/normalizarFoco.js";
import { normalizarNome } from "./regras/textosDoConhecimento.js";

const vazio: Perfil = { comoChamar: null, papel: null, experiencia: null, foco: null, compartilharComIa: false, atualizadoEm: null };

export function lerPerfil(base?: string): Perfil {
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) return { ...vazio };
  return comBancoDeConhecimento(base, (db) => { const r = db.prepare('SELECT como_chamar, papel, experiencia, foco, compartilhar_ia, atualizado_em FROM perfis WHERE usuario_id = ?').get(pessoa) as Linha | undefined;
    return { comoChamar: (r?.como_chamar as string | null) ?? null, papel: (r?.papel as Papel | null) ?? null, experiencia: (r?.experiencia as Experiencia | null) ?? null, foco: (r?.foco as string | null) ?? null,
      compartilharComIa: Number(r?.compartilhar_ia ?? 0) === 1, atualizadoEm: (r?.atualizado_em as string | null) ?? null }; });
}

export function salvarPerfil(a: { comoChamar?: string | null; papel?: Papel | null; experiencia?: Experiencia | null; foco?: string | null; compartilharComIa?: boolean }, base?: string): Perfil {
  const pessoa = pessoaDoConhecimento(base); if (!pessoa) falharConhecimento('PROFILE_SESSION_REQUIRED');
  const atual = lerPerfil(base);
  const nome = a.comoChamar === undefined ? atual.comoChamar : a.comoChamar === null || a.comoChamar === '' ? null : normalizarNome(a.comoChamar) ?? falharConhecimento('PROFILE_NAME_INVALID');
  const papel = a.papel === undefined ? atual.papel : a.papel; if (papel !== null && !papeis.includes(papel)) falharConhecimento('PROFILE_ROLE_INVALID');
  const experiencia = a.experiencia === undefined ? atual.experiencia : a.experiencia; if (experiencia !== null && !experiencias.includes(experiencia)) falharConhecimento('PROFILE_EXPERIENCE_INVALID');
  const foco = a.foco === undefined ? atual.foco : a.foco === null ? null : normalizarFoco(a.foco);
  const compartilhar = a.compartilharComIa === undefined ? atual.compartilharComIa : a.compartilharComIa;
  return comBancoDeConhecimento(base, (db) => { db.prepare(`INSERT INTO perfis (usuario_id, como_chamar, papel, experiencia, foco, compartilhar_ia, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET como_chamar = excluded.como_chamar, papel = excluded.papel, experiencia = excluded.experiencia, foco = excluded.foco, compartilhar_ia = excluded.compartilhar_ia, atualizado_em = excluded.atualizado_em`).run(pessoa, nome, papel, experiencia, foco, compartilhar ? 1 : 0, new Date().toISOString());
    return lerPerfil(base); });
}
