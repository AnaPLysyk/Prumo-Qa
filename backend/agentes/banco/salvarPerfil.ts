/** Salva o perfil da pessoa da sessão: como chamar, papel, experiência, foco e a autorização de compartilhar com a IA externa. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './validacoesDoConhecimento.js';
import { lerPerfil } from './lerPerfil.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';
import { normalizarFoco } from '../regras/normalizarFoco.js';
import { normalizarNome } from '../regras/textosDoConhecimento.js';
import { Perfil } from '../tipos/conhecimento.js';
import { Experiencia, Papel, experiencias, papeis } from '../tipos/persona.js';

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
