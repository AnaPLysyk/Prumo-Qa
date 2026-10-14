/** Aprovação humana no macOS: a janela de autenticação do próprio sistema (senha ou Touch ID), com o escopo no texto. */
import os from 'node:os';
import { Aprovacao, EscopoAprovacao } from '../tipos/aprovacao.js';
import { ExecutorDeAprovador, executarAprovador } from './executarAprovador.js';
import { textoDaAprovacao } from './textoDaAprovacao.js';

/** O texto vai como argumento do AppleScript (nunca interpolado em código). Sucesso só se o sistema autenticou a pessoa. */
export async function aprovarNoMac(escopo:EscopoAprovacao,executar:ExecutorDeAprovador=executarAprovador):Promise<Aprovacao|null> {
  const expira = Date.parse(escopo.expiresAt);
  if (!Number.isFinite(expira) || Date.now() >= expira) return null;
  const r = await executar('/usr/bin/osascript',['-e','on run argv','-e','do shell script "/usr/bin/true" with prompt (item 1 of argv) with administrator privileges','-e','end run','--',textoDaAprovacao(escopo)],120000);
  if (r.timedOut) throw new Error('APPROVAL_TIMEOUT: consentimento não concluído em 120 segundos.');
  if (r.code!==0 || Date.now() >= expira) return null;
  return { subject:os.userInfo().username, method:'macOS-AdminAuth', scopeHash:escopo.scopeHash, at:new Date().toISOString() };
}
