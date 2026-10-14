/** Gestão de contas pela Administração: listar, criar com senha temporária, aprovar, trocar papel, desativar, redefinir senha, desbloquear e excluir. */
import { randomUUID } from 'node:crypto';
import { gerarSenhaTemporaria, resumirSegredo } from './senhas.js';
import { contaParaJanela, situacaoDaSessao } from './sessao.js';
import { gravarContas } from '../banco/gravarContas.js';
import { lerContas } from '../banco/lerContas.js';
import { ContaVisivel, RegistroDeContas, Usuario, estadosDaConta, loginSchema, nomeDaPessoaSchema } from '../tipos/contas.js';

function quemAdministra(b?: string): Usuario {
  const s = situacaoDaSessao(b);
  if (s.tipo === 'SEM_LOGIN') throw new Error('LOGIN_NOT_ACTIVE: ative o login antes de gerenciar usuários.');
  if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return s.usuario;
}

function contaPeloId(r: RegistroDeContas, id: string): Usuario {
  const u = r.usuarios.find((x) => x.id === id); if (!u) throw new Error('ACCOUNT_NOT_FOUND: conta não encontrada; atualize a lista.'); return u;
}

/** Sempre sobra ao menos um administrador ativo: sem ele ninguém mais gerencia contas pela janela. */
function garantirAdministrador(r: RegistroDeContas): void {
  if (!r.usuarios.some((u) => u.papel === 'administrador' && u.estado === 'ATIVO')) throw new Error('LAST_ADMIN: precisa existir ao menos um administrador ativo.');
}

export function listarContasDeAcesso(b?: string): { contas: ContaVisivel[]; voce: string | null } {
  const r = lerContas(b); const agora = Date.now(); const s = situacaoDaSessao(b, agora, false);
  const ordem = { PENDENTE: 0, ATIVO: 1, DESATIVADO: 2 } as const;
  return { contas: r.usuarios.map((u) => contaParaJanela(r, u, agora)).sort((a, z) => ordem[a.estado] - ordem[z.estado] || a.nome.localeCompare(z.nome, 'pt-BR')), voce: s.tipo === 'ATIVA' ? s.usuario.id : null };
}

/** Conta criada pela Administração: senha temporária mostrada uma vez e troca obrigatória no primeiro acesso. */
export async function criarContaPelaAdministracao(d: { login: string; nome: string; papel: string }, b?: string, agora = new Date()) {
  quemAdministra(b);
  const login = loginSchema.safeParse(d.login); if (!login.success) throw new Error('LOGIN_INVALID_FORMAT: ' + login.error.issues[0]!.message);
  const nome = nomeDaPessoaSchema.safeParse(d.nome); if (!nome.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.');
  const temporaria = gerarSenhaTemporaria(); const senha = await resumirSegredo(temporaria);
  const r = lerContas(b);
  if (!r.papeis.some((p) => p.id === d.papel)) throw new Error('ROLE_NOT_FOUND: papel inexistente.');
  if (r.usuarios.some((u) => u.login === login.data)) throw new Error('LOGIN_TAKEN: esse login já está em uso; escolha outro.');
  const quando = agora.toISOString();
  const u: Usuario = { id: randomUUID(), login: login.data, nome: nome.data, papel: d.papel, estado: 'ATIVO', senha, recuperacao: null, trocarSenha: true, falhas: 0, bloqueadoAte: null, criadoEm: quando, atualizadoEm: quando, ultimoAcesso: null, origem: 'ADMINISTRACAO' };
  r.usuarios.push(u); gravarContas(r, b);
  return { conta: contaParaJanela(r, u, agora.getTime()), senhaTemporaria: temporaria };
}

/** Aprovar (PENDENTE → ATIVO), desativar, reativar, trocar papel ou nome. Ninguém desativa a si mesmo nem tira o último administrador. */
export function alterarContaPelaAdministracao(d: { id: string; nome?: string; papel?: string; estado?: string }, b?: string, agora = new Date()) {
  const eu = quemAdministra(b); const r = lerContas(b); const u = contaPeloId(r, d.id);
  if (d.papel !== undefined) { if (!r.papeis.some((p) => p.id === d.papel)) throw new Error('ROLE_NOT_FOUND: papel inexistente.'); u.papel = d.papel; }
  if (d.nome !== undefined) { const n = nomeDaPessoaSchema.safeParse(d.nome); if (!n.success) throw new Error('NAME_INVALID: o nome precisa ter de 2 a 80 caracteres.'); u.nome = n.data; }
  if (d.estado !== undefined) {
    if (!estadosDaConta.includes(d.estado as never) || d.estado === 'PENDENTE') throw new Error('ACCOUNT_STATE_INVALID: use ATIVO ou DESATIVADO.');
    if (u.id === eu.id && d.estado !== 'ATIVO') throw new Error('SELF_DISABLE: você não pode desativar a própria conta.');
    u.estado = d.estado as Usuario['estado'];
  }
  if (u.id === eu.id && u.papel !== 'administrador') throw new Error('SELF_DEMOTE: você não pode tirar o próprio papel de administrador; peça a outro administrador.');
  garantirAdministrador(r); u.atualizadoEm = agora.toISOString(); gravarContas(r, b);
  return contaParaJanela(r, u, agora.getTime());
}

/** Redefinir senha de outra pessoa: gera senha temporária, exige troca no próximo acesso e desbloqueia a conta. */
export async function redefinirSenhaPelaAdministracao(id: string, b?: string, agora = new Date()) {
  const eu = quemAdministra(b); if (eu.id === id) throw new Error('USE_MY_ACCOUNT: para a sua própria senha use Minha conta › Trocar senha.');
  const temporaria = gerarSenhaTemporaria(); const senha = await resumirSegredo(temporaria);
  const r = lerContas(b); const u = contaPeloId(r, id);
  Object.assign(u, { senha, trocarSenha: true, falhas: 0, bloqueadoAte: null, atualizadoEm: agora.toISOString() }); gravarContas(r, b);
  return { conta: contaParaJanela(r, u, agora.getTime()), senhaTemporaria: temporaria };
}

export function desbloquearConta(id: string, b?: string, agora = new Date()) {
  quemAdministra(b); const r = lerContas(b); const u = contaPeloId(r, id);
  u.falhas = 0; u.bloqueadoAte = null; u.atualizadoEm = agora.toISOString(); gravarContas(r, b); return contaParaJanela(r, u, agora.getTime());
}

/** Excluir só conta pendente ou desativada (desative antes); a própria conta nunca. */
export function excluirConta(id: string, b?: string) {
  const eu = quemAdministra(b); if (eu.id === id) throw new Error('SELF_DELETE: você não pode excluir a própria conta.');
  const r = lerContas(b); const u = contaPeloId(r, id);
  if (u.estado === 'ATIVO') throw new Error('ACCOUNT_ACTIVE: desative a conta antes de excluir.');
  r.usuarios = r.usuarios.filter((x) => x.id !== id); garantirAdministrador(r); gravarContas(r, b); return { excluida: id };
}
