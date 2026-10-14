/** Roda um programa de autenticação do sistema (osascript, zenity, pkexec) sem shell, com prazo, e devolve o código de saída. */
import { spawn } from 'node:child_process';

export type ResultadoDoAprovador = { code:number|null; timedOut:boolean };
export type ExecutorDeAprovador = (programa:string,args:string[],prazoMs:number)=>Promise<ResultadoDoAprovador>;

export const executarAprovador:ExecutorDeAprovador = (programa,args,prazoMs) => new Promise(resolve => {
  const filho = spawn(programa,args,{ shell:false, stdio:'ignore', env:{ PATH:'/usr/bin:/bin:/usr/local/bin', HOME:process.env.HOME??'', DISPLAY:process.env.DISPLAY??'', WAYLAND_DISPLAY:process.env.WAYLAND_DISPLAY??'', XDG_RUNTIME_DIR:process.env.XDG_RUNTIME_DIR??'', DBUS_SESSION_BUS_ADDRESS:process.env.DBUS_SESSION_BUS_ADDRESS??'', XAUTHORITY:process.env.XAUTHORITY??'', LANG:process.env.LANG??'C.UTF-8' } });
  let expirou = false;
  const timer = setTimeout(() => { expirou = true; filho.kill('SIGKILL'); }, prazoMs);
  filho.on('error',() => { clearTimeout(timer); resolve({ code:null, timedOut:false }); });
  filho.on('close',code => { clearTimeout(timer); resolve({ code, timedOut:expirou }); });
});
