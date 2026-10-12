/** Encerra o processo de teste e todos os processos filhos (taskkill /T no Windows). */
import { spawn } from 'node:child_process';
import path from 'node:path';

export async function encerrarArvoreDeProcessos(pid:number|undefined) {
  if (!pid) return;
  if (process.platform==='win32' && process.env.SystemRoot) {
    await new Promise<void>(resolve=>{
      const k=spawn(path.join(process.env.SystemRoot!,'System32','taskkill.exe'),['/PID',String(pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});
      const t=setTimeout(()=>{ k.kill();resolve(); },3000); k.on('error',()=>{clearTimeout(t);resolve();});k.on('close',()=>{clearTimeout(t);resolve();});
    });
  } else { try { process.kill(-pid,'SIGKILL'); } catch { try { process.kill(pid,'SIGKILL'); } catch {} } }
}
