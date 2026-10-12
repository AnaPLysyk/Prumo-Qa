/** Salva como a pessoa quer ser chamada e o papel dela. */
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { falharConhecimento } from './falharConhecimento.js';
import { lerPerfil } from './lerPerfil.js';
import { normalizarNome } from '../regras/normalizarNome.js';
import { Perfil } from '../tipos/conhecimento.js';
import { Papel, papeis } from '../tipos/persona.js';

export function salvarPerfil(a: { comoChamar?: string | null; papel?: Papel | null }, base?: string): Perfil {
  const atual = lerPerfil(base);
  const nome = a.comoChamar === undefined ? atual.comoChamar : a.comoChamar === null || a.comoChamar === '' ? null : normalizarNome(a.comoChamar) ?? falharConhecimento('PROFILE_NAME_INVALID');
  const papel = a.papel === undefined ? atual.papel : a.papel; if (papel !== null && !papeis.includes(papel)) falharConhecimento('PROFILE_ROLE_INVALID');
  return comBancoDeConhecimento(base, (db) => { db.prepare('INSERT INTO perfil (id, como_chamar, papel, atualizado_em) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET como_chamar = excluded.como_chamar, papel = excluded.papel, atualizado_em = excluded.atualizado_em').run(nome, papel, new Date().toISOString());
    return lerPerfil(base); });
}
