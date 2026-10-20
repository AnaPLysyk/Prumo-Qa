/** Exige aprovação nativa do Windows, macOS ou Linux antes de executar ações. */
import fs from "node:fs";
import os from "node:os";
import { Aprovacao, EscopoAprovacao } from "./tipos/catalogoDeTestes.js";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/** O texto vai como argumento do AppleScript (nunca interpolado em código). Sucesso só se o sistema autenticou a pessoa. */
export async function aprovarNoMac(escopo:EscopoAprovacao,executar:ExecutorDeAprovador=executarAprovador):Promise<Aprovacao|null> {
  const expira = Date.parse(escopo.expiresAt);
  if (!Number.isFinite(expira) || Date.now() >= expira) return null;
  const r = await executar('/usr/bin/osascript',['-e','on run argv','-e','do shell script "/usr/bin/true" with prompt (item 1 of argv) with administrator privileges','-e','end run','--',textoDaAprovacao(escopo)],120000);
  if (r.timedOut) throw new Error('APPROVAL_TIMEOUT: consentimento não concluído em 120 segundos.');
  if (r.code!==0 || Date.now() >= expira) return null;
  return { subject:os.userInfo().username, method:'macOS-AdminAuth', scopeHash:escopo.scopeHash, at:new Date().toISOString() };
}

type ResultadoDoAprovador = { code:number|null; timedOut:boolean };

export type ExecutorDeAprovador = (programa:string,args:string[],prazoMs:number)=>Promise<ResultadoDoAprovador>;

export const executarAprovador:ExecutorDeAprovador = (programa,args,prazoMs) => new Promise(resolve => {
  const filho = spawn(programa,args,{ shell:false, stdio:'ignore', env:{ PATH:'/usr/bin:/bin:/usr/local/bin', HOME:process.env.HOME??'', DISPLAY:process.env.DISPLAY??'', WAYLAND_DISPLAY:process.env.WAYLAND_DISPLAY??'', XDG_RUNTIME_DIR:process.env.XDG_RUNTIME_DIR??'', DBUS_SESSION_BUS_ADDRESS:process.env.DBUS_SESSION_BUS_ADDRESS??'', XAUTHORITY:process.env.XAUTHORITY??'', LANG:process.env.LANG??'C.UTF-8' } });
  let expirou = false;
  const timer = setTimeout(() => { expirou = true; filho.kill('SIGKILL'); }, prazoMs);
  filho.on('error',() => { clearTimeout(timer); resolve({ code:null, timedOut:false }); });
  filho.on('close',code => { clearTimeout(timer); resolve({ code, timedOut:expirou }); });
});

/** Aprovação não recebe credencial, booleano, token ou variável de ambiente da IA. */
export async function solicitarAprovacao(escopo:EscopoAprovacao):Promise<Aprovacao | null> {
  if (process.platform === 'darwin') return await aprovarNoMac(escopo);
  if (process.platform === 'linux') return await aprovarNoLinux(escopo);
  if (process.platform !== 'win32') return null;
  const sistema = process.env.SystemRoot;
  if (!sistema || !path.isAbsolute(sistema)) return null;
  const broker = fileURLToPath(new URL('../aprovar.exe',import.meta.url));
  await fs.promises.access(broker);
  return await new Promise((resolve,reject) => {
    const filho = spawn(broker,[], {
      windowsHide:true, shell:false, env:{ SystemRoot:sistema, WINDIR:sistema }, stdio:['pipe','pipe','pipe']
    });
    let saida=''; let erro=''; let fechado=false;
    let expirou=false;
    const timer=setTimeout(() => { expirou=true;filho.kill(); }, 120000);
    filho.stdout.on('data',b => { if (saida.length<4096) saida+=b.toString(); else filho.kill(); });
    filho.stderr.on('data',b => { if(erro.length<4096) erro+=b.toString(); });
    filho.on('error',() => { clearTimeout(timer); resolve(null); });
    filho.on('close',code => {
      clearTimeout(timer); if (fechado) return; fechado=true;
      if(code!==0){const diagnostico=erro.match(/(?:CREDUI_ERROR_|LOGON_ERROR_)\d+/)?.[0];return reject(new Error(expirou?'APPROVAL_TIMEOUT: consentimento não concluído em 120 segundos.':diagnostico ?? 'BROKER_UNAVAILABLE: autenticação nativa não iniciou/concluiu.'));}
      try {
        const r=JSON.parse(saida);
        if (code !== 0 || r.scopeHash !== escopo.scopeHash || typeof r.subject !== 'string' || r.method !== 'Windows-CredUI-LogonUser' || Date.now() > Date.parse(escopo.expiresAt)) return resolve(null);
        resolve({ ...r,at:new Date().toISOString() });
      } catch { resolve(null); }
    });
    filho.stdin.on('error',() => {});
    filho.stdin.end(JSON.stringify(escopo));
  });
}

const cortar = (s:string,n:number) => (s.length>n ? s.slice(0,n-1)+'…' : s).replace(/[\u0000-\u001f]+/g,' ');

export function textoDaAprovacao(e:EscopoAprovacao):string {
  return [`Prumo QA quer executar "${cortar(e.capability,60)}".`,`Projeto: ${cortar(e.projectId,60)}`,`Pasta: ${cortar(e.root,120)}`,`Comando: ${cortar(e.command,200)}`,`Escopo: ${e.scopeHash.slice(0,16)}`,'Só aprove se foi você quem pediu.'].join('\n');
}
