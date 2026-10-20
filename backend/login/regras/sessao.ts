/** Sessão de quem entrou no Prumo: fica só na memória do processo principal e termina ao sair, ao fechar o Prumo ou por inatividade. */
import { lerContas } from '../banco/lerContas.js';
import { definirUsuarioDoEscopo } from '../../compartilhado/banco/escopoDeUsuario.js';
import { renovarCredencialMcp, revogarCredencialMcp } from '../../aplicativo/ponteDaSessaoMcp.js';
import { usarAutenticacaoRemota } from '../integracoes/configuracaoDaAutenticacao.js';
import { ContaVisivel, IdModulo, NivelDeAcesso, Papel, RegistroDeContas, Usuario, modulosDoMenu } from '../tipos/contas.js';

let atual: { usuarioId: string; ultimoUso: number } | null = null;

export function iniciarSessao(usuarioId: string, agora = Date.now()): void { definirUsuarioDoEscopo(usuarioId); atual = { usuarioId, ultimoUso: agora }; renovarCredencialMcp(); }

export function encerrarSessao(): void { atual = null; definirUsuarioDoEscopo(null); revogarCredencialMcp(); }

/** O login vale assim que existe a primeira conta (criada ao ativar o login na Administração). */
export const loginLigado = (r: RegistroDeContas) => r.usuarios.length > 0;

/** Papel da conta; papel apagado ou desconhecido não dá acesso a nada. */
export function papelDaConta(r: RegistroDeContas, u: Pick<Usuario, 'papel'>): Papel | null { return r.papeis.find((p) => p.id === u.papel) ?? null; }

/** Nível do papel numa tela. O administrador fixo sempre pode tudo, mesmo que o arquivo diga outra coisa. */
export function nivelNaTela(papel: Papel | null, tela: IdModulo): NivelDeAcesso {
  if (!papel) return 'NENHUM'; if (papel.fixo && papel.id === 'administrador') return 'USAR';
  return papel.telas[tela] ?? 'NENHUM';
}

export const telasDoPapel = (papel: Papel | null) => Object.fromEntries(modulosDoMenu.map((m) => [m.id, nivelNaTela(papel, m.id)])) as Record<IdModulo, NivelDeAcesso>;

/** Tem a marca admin? Conta gravada antes da 2.15.1 (sem o campo) segue o papel Administrador, para ninguém perder o acesso. */
export const ehAdmin = (u: Pick<Usuario, 'admin' | 'papel'>) => u.admin ?? u.papel === 'administrador';

/** Nível da conta numa tela: a Administração só para quem tem a marca admin; as demais seguem o papel. */
export function nivelDaConta(u: Pick<Usuario, 'admin' | 'papel'>, papel: Papel | null, tela: IdModulo): NivelDeAcesso {
  if (tela === 'administracao') return ehAdmin(u) ? 'USAR' : 'NENHUM';
  return nivelNaTela(papel, tela);
}

export const telasDaConta = (u: Pick<Usuario, 'admin' | 'papel'>, papel: Papel | null) => Object.fromEntries(modulosDoMenu.map((m) => [m.id, nivelDaConta(u, papel, m.id)])) as Record<IdModulo, NivelDeAcesso>;

export function contaParaJanela(r: RegistroDeContas, u: Usuario, agora = Date.now()): ContaVisivel {
  return { id: u.id, login: u.login, nome: u.nome, papel: u.papel, papelNome: papelDaConta(r, u)?.nome ?? u.papel, estado: u.estado, trocarSenha: u.trocarSenha, criadoEm: u.criadoEm, ultimoAcesso: u.ultimoAcesso, origem: u.origem,
    bloqueada: !!u.bloqueadoAte && Date.parse(u.bloqueadoAte) > agora, email: u.email ?? null, admin: ehAdmin(u), duasEtapas: !!u.email && (!!u.duasEtapas || r.acesso.exigirDuasEtapas) };
}

type SituacaoDaSessao =
  | { tipo: 'SEM_LOGIN'; registro: RegistroDeContas }
  | { tipo: 'SEM_SESSAO' | 'EXPIRADA'; registro: RegistroDeContas }
  | { tipo: 'ATIVA'; registro: RegistroDeContas; usuario: Usuario; papel: Papel | null };

/**
 * Relê a conta a cada pedido: conta desativada, apagada ou com papel trocado vale na hora. Pedido depois do tempo de
 * inatividade encerra a sessão; pedido dentro do prazo renova o prazo (tocar = false só consulta, sem renovar).
 */
export function situacaoDaSessao(b?: string, agora = Date.now(), tocar = true): SituacaoDaSessao {
  const registro = lerContas(b);
  if (!loginLigado(registro)) { encerrarSessao(); return { tipo: 'SEM_LOGIN', registro }; }
  if (!atual) return { tipo: 'SEM_SESSAO', registro };
  const usuario = registro.usuarios.find((u) => u.id === atual!.usuarioId);
  if (!usuario || usuario.estado !== 'ATIVO') { encerrarSessao(); return { tipo: 'SEM_SESSAO', registro }; }
  if (agora - atual.ultimoUso > registro.acesso.minutosDeInatividade * 60_000) { encerrarSessao(); return { tipo: 'EXPIRADA', registro }; }
  if (tocar) atual.ultimoUso = agora;
  return { tipo: 'ATIVA', registro, usuario, papel: papelDaConta(registro, usuario) };
}

/** O que a janela precisa saber para desenhar o login ou o menu: nunca resumo de senha. */
export function sessaoParaJanela(b?: string, agora = Date.now()) {
  const s = situacaoDaSessao(b, agora, false);
  const modoMvp = process.env.PRUMO_LOGIN_MVP === '1';
  const geral = { loginMvpSemServico: modoMvp && !usarAutenticacaoRemota(), identidadeRemota: usarAutenticacaoRemota(), cadastroAberto: s.registro.acesso.cadastroAberto, aprovarCadastros: s.registro.acesso.aprovarCadastros, minutosDeInatividade: s.registro.acesso.minutosDeInatividade, entradaGithub: false, entradaGoogle: false, exigirDuasEtapas: s.registro.acesso.exigirDuasEtapas };
  // Sem nenhuma conta o Prumo não libera tela alguma: a janela mostra só a criação da conta de Administrador.
  if (s.tipo === 'SEM_LOGIN') return { loginAtivo: modoMvp || usarAutenticacaoRemota(), usuario: null, expirou: false, telas: telasDoPapel(null), ...geral };
  if (s.tipo !== 'ATIVA') return { loginAtivo: true, usuario: null, expirou: s.tipo === 'EXPIRADA', telas: telasDoPapel(null), ...geral };
  return { loginAtivo: true, usuario: contaParaJanela(s.registro, s.usuario, agora), expirou: false, telas: telasDaConta(s.usuario, s.papel), ...geral };
}

/** Id de quem está na sessão agora (sem renovar o prazo), para registrar autoria; null sem login ou sem sessão. */
export function contaDaSessao(b?: string): Usuario | null {
  try { const s = situacaoDaSessao(b, Date.now(), false); return s.tipo === 'ATIVA' ? s.usuario : null; } catch { return null; }
}
