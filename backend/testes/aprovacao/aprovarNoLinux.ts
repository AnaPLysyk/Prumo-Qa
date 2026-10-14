/** Aprovação humana no Linux: janela com o escopo (zenity ou kdialog) e, em seguida, a autenticação do sistema (polkit/pkexec). */
import fs from 'node:fs';
import os from 'node:os';
import { Aprovacao, EscopoAprovacao } from '../tipos/aprovacao.js';
import { ExecutorDeAprovador, executarAprovador } from './executarAprovador.js';
import { textoDaAprovacao } from './textoDaAprovacao.js';

const achar = (nome:string) => ['/usr/bin','/usr/local/bin','/bin'].map(d => `${d}/${nome}`).find(c => { try { fs.accessSync(c,fs.constants.X_OK); return true; } catch { return false; } });

/** Sem janela para mostrar o escopo ou sem polkit, não aprova: o pedido fica BLOCKED em vez de aprovar às cegas. */
export async function aprovarNoLinux(escopo:EscopoAprovacao,executar:ExecutorDeAprovador=executarAprovador,procurar:(n:string)=>string|undefined=achar):Promise<Aprovacao|null> {
  const expira = Date.parse(escopo.expiresAt);
  if (!Number.isFinite(expira) || Date.now() >= expira) return null;
  const pkexec = procurar('pkexec'), zenity = procurar('zenity'), kdialog = procurar('kdialog');
  if (!pkexec || (!zenity && !kdialog)) throw new Error('APPROVAL_UNAVAILABLE: instale o polkit (pkexec) e o zenity ou o kdialog para aprovar ações neste sistema.');
  const texto = textoDaAprovacao(escopo);
  const mostrar = zenity
    ? await executar(zenity,['--question','--no-markup','--title=Prumo QA','--ok-label=Aprovar','--cancel-label=Cancelar','--width=520','--text='+texto],120000)
    : await executar(kdialog!,['--title','Prumo QA','--warningyesno',texto,'--yes-label','Aprovar','--no-label','Cancelar'],120000);
  if (mostrar.timedOut) throw new Error('APPROVAL_TIMEOUT: consentimento não concluído em 120 segundos.');
  if (mostrar.code!==0 || Date.now() >= expira) return null;
  const auth = await executar(pkexec,['/usr/bin/true'],120000);
  if (auth.timedOut) throw new Error('APPROVAL_TIMEOUT: consentimento não concluído em 120 segundos.');
  if (auth.code!==0 || Date.now() >= expira) return null;
  return { subject:os.userInfo().username, method:'Linux-Polkit', scopeHash:escopo.scopeHash, at:new Date().toISOString() };
}
