/** Confere, antes de atender um canal da janela, se há sessão válida e se o papel da pessoa permite aquela tela e nível. */
import { nivelDaConta, situacaoDaSessao } from './sessao.js';
import { acessoDosCanais } from '../tipos/acessoDosCanais.js';
import { modulosDoMenu } from '../tipos/contas.js';
import type { CanalIpc } from '../../aplicativo/api/catalogoDeContratos.js';
import {usarAutenticacaoRemota} from '../integracoes/autenticacaoRemota.js';

/**
 * Enquanto não existe nenhuma conta, além dos públicos só atendem os canais do primeiro acesso: criar a conta de Administrador ou
 * configurar o GitHub/Google para criá-la pelo provedor. Quem está no computador sem contas vira Administrador de qualquer jeito.
 */
const CANAIS_DO_PRIMEIRO_ACESSO: readonly CanalIpc[] = ['usuarios:ativar', 'acesso:github', 'acesso:google'];

/**
 * O Prumo não abre sem entrar: sem nenhuma conta, só o primeiro acesso é atendido.
 * A recusa vem com código próprio e uma frase que a pessoa entende.
 */
export function conferirAcessoAoCanal(canal: CanalIpc, b?: string, agora = Date.now(), renovarAtividade = true): void {
  const regra = acessoDosCanais[canal];
  // No MVP, não existe cadastro local por senha nem entrada social escondida via IPC.
  if (process.env.PRUMO_LOGIN_MVP === '1' && !usarAutenticacaoRemota() && [
    'usuarios:ativar','conta:entrar','conta:cadastrar','conta:recuperar','conta:duasetapas',
    'conta:senha','acesso:github','acesso:google','conta:githubiniciar','conta:githubestado',
    'conta:googleiniciar','conta:googleestado'
  ].includes(canal)) throw new Error('LOGIN_METHOD_DISABLED: use o código enviado ao e-mail.');
  // No login central, os caminhos locais de criação de admin, reset e OAuth ficam fechados
  // inclusive para chamadas diretas ao IPC (ocultar botões não é controle de acesso).
  if (usarAutenticacaoRemota() && [
    'usuarios:ativar','acesso:github','acesso:google','conta:recuperar','conta:reenviarentrada',
    'conta:confirmarentrada','conta:duasetapas','conta:senha','conta:githubiniciar',
    'conta:githubestado','conta:googleiniciar','conta:googleestado'
  ].includes(canal)) throw new Error('LOGIN_METHOD_DISABLED: use a autenticação central do Prumo.');
  if (regra === 'publico') return;
  // Consultas automáticas validam o acesso, mas não são interação humana.
  const s = situacaoDaSessao(b, agora, renovarAtividade);
  if (s.tipo === 'SEM_LOGIN') { if (process.env.PRUMO_LOGIN_MVP !== '1' && CANAIS_DO_PRIMEIRO_ACESSO.includes(canal)) return; throw new Error('LOGIN_SETUP_REQUIRED: crie a conta de Administrador para começar a usar o Prumo.'); }
  if (s.tipo === 'EXPIRADA') throw new Error('SESSION_EXPIRED: a sessão terminou por inatividade; entre de novo.');
  if (s.tipo !== 'ATIVA') throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  if (regra === 'conta') return;
  if (s.usuario.trocarSenha) throw new Error('PASSWORD_CHANGE_REQUIRED: troque a senha temporária para continuar.');
  if (regra === 'base') return;
  const [tela, precisa] = regra; const nivel = nivelDaConta(s.usuario, s.papel, tela);
  if (nivel === 'USAR' || (nivel === 'VER' && precisa === 'VER')) return;
  const rotulo = modulosDoMenu.find((m) => m.id === tela)!.rotulo;
  if (tela === 'administracao') throw new Error('PERMISSION_DENIED: a tela Administração é só para contas marcadas como admin.');
  throw new Error('PERMISSION_DENIED: o papel ' + (s.papel?.nome ?? s.usuario.papel) + ' não permite ' + (precisa === 'VER' ? 'consultar' : 'alterar') + ' em ' + rotulo + '. Peça acesso à Administração.');
}
