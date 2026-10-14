/** Confere, antes de atender um canal da janela, se há sessão válida e se o papel da pessoa permite aquela tela e nível. */
import { nivelNaTela, situacaoDaSessao } from './sessao.js';
import { acessoDosCanais } from '../tipos/acessoDosCanais.js';
import { modulosDoMenu } from '../tipos/contas.js';
import type { CanalIpc } from '../../aplicativo/api/catalogoDeContratos.js';

/** Sem login ligado tudo segue como antes. Com login, a recusa vem com código próprio e uma frase que a pessoa entende. */
export function conferirAcessoAoCanal(canal: CanalIpc, b?: string, agora = Date.now()): void {
  const regra = acessoDosCanais[canal];
  if (regra === 'publico') return;
  const s = situacaoDaSessao(b, agora);
  if (s.tipo === 'SEM_LOGIN') return;
  if (s.tipo === 'EXPIRADA') throw new Error('SESSION_EXPIRED: a sessão terminou por inatividade; entre de novo.');
  if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  if (regra === 'conta') return;
  if (s.usuario.trocarSenha) throw new Error('PASSWORD_CHANGE_REQUIRED: troque a senha temporária para continuar.');
  if (regra === 'base') return;
  const [tela, precisa] = regra; const nivel = nivelNaTela(s.papel, tela);
  if (nivel === 'USAR' || (nivel === 'VER' && precisa === 'VER')) return;
  const rotulo = modulosDoMenu.find((m) => m.id === tela)!.rotulo;
  throw new Error('PERMISSION_DENIED: o papel ' + (s.papel?.nome ?? s.usuario.papel) + ' não permite ' + (precisa === 'VER' ? 'consultar' : 'alterar') + ' em ' + rotulo + '. Peça acesso à Administração.');
}
