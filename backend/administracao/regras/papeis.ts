/** Papéis e permissões por tela, e a configuração geral de acesso (cadastro, inatividade e bloqueio), decididos na Administração. */
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { gravarContas } from '../../login/banco/gravarContas.js';
import { lerContas } from '../../login/banco/lerContas.js';
import { ConfiguracaoDeAcesso, IdModulo, NivelDeAcesso, Papel, configuracaoDeAcessoSchema, modulosDoMenu, niveisDeAcesso } from '../../login/tipos/contas.js';

export function listarPapeis(b?: string) {
  const r = lerContas(b);
  return { papeis: r.papeis.map((p) => ({ ...p, contas: r.usuarios.filter((u) => u.papel === p.id).length })), modulos: modulosDoMenu, niveis: niveisDeAcesso, papelDoCadastro: r.acesso.papelDoCadastro };
}

/** Cria ou altera um papel. O administrador é fixo; tela não informada fica sem acesso (NENHUM). */
export function salvarPapel(d: { id?: string; nome: string; descricao?: string; telas: Record<string, string> }, b?: string) {
  const r = lerContas(b);
  const telas = Object.fromEntries(modulosDoMenu.map((m) => [m.id, niveisDeAcesso.includes(d.telas[m.id] as NivelDeAcesso) ? d.telas[m.id] : 'NENHUM'])) as Record<IdModulo, NivelDeAcesso>;
  const nome = d.nome.trim(); if (nome.length < 2 || nome.length > 40) throw new Error('ROLE_NAME_INVALID: o nome do papel precisa ter de 2 a 40 caracteres.');
  if (r.papeis.some((p) => p.id !== d.id && p.nome.toLowerCase() === nome.toLowerCase())) throw new Error('ROLE_NAME_TAKEN: já existe um papel com esse nome.');
  if (d.id) {
    const p = r.papeis.find((x) => x.id === d.id); if (!p) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
    if (p.fixo) throw new Error('ROLE_FIXED: o papel Administrador é fixo e sempre tem acesso a tudo.');
    Object.assign(p, { nome, descricao: (d.descricao ?? p.descricao).trim().slice(0, 200), telas });
  } else {
    const base = semAcentos(nome).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'papel';
    let id = base; for (let i = 2; r.papeis.some((p) => p.id === id); i++) id = base + '-' + i;
    if (id.length < 2) id = 'papel-' + id;
    r.papeis.push({ id, nome, descricao: (d.descricao ?? '').trim().slice(0, 200), fixo: false, telas } satisfies Papel);
  }
  gravarContas(r, b); return listarPapeis(b);
}

/** Excluir só papel que ninguém usa e que não é o papel dado a novos cadastros. */
export function excluirPapel(id: string, b?: string) {
  const r = lerContas(b); const p = r.papeis.find((x) => x.id === id); if (!p) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (p.fixo) throw new Error('ROLE_FIXED: o papel Administrador é fixo.');
  const usam = r.usuarios.filter((u) => u.papel === id).length; if (usam) throw new Error('ROLE_IN_USE: ' + usam + ' conta(s) usam este papel; troque o papel delas antes.');
  if (r.acesso.papelDoCadastro === id) throw new Error('ROLE_IN_USE: este é o papel dado a novos cadastros; escolha outro em Configurações gerais antes.');
  r.papeis = r.papeis.filter((x) => x.id !== id); gravarContas(r, b); return listarPapeis(b);
}

export const configuracaoDeAcesso = (b?: string): ConfiguracaoDeAcesso => lerContas(b).acesso;

/** Novos cadastros nunca entram como administrador: esse papel só a Administração dá. */
export function salvarConfiguracaoDeAcesso(d: Omit<ConfiguracaoDeAcesso, 'githubClientId' | 'googleClientId'>, b?: string): ConfiguracaoDeAcesso {
  // Os Client IDs do GitHub e do Google têm canal próprio (junto com o segredo): salvar as regras gerais nunca o apaga.
  const r = lerContas(b); const acesso = configuracaoDeAcessoSchema.parse({ ...d, githubClientId: r.acesso.githubClientId, googleClientId: r.acesso.googleClientId });
  if (!r.papeis.some((p) => p.id === acesso.papelDoCadastro)) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (acesso.papelDoCadastro === 'administrador') throw new Error('SIGNUP_ROLE_FORBIDDEN: novos cadastros não podem entrar como administrador.');
  r.acesso = acesso; gravarContas(r, b); return acesso;
}
