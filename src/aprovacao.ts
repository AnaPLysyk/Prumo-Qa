import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

export type EscopoAprovacao = { projectId:string; root:string; capability:string; scopeHash:string; command:string; expiresAt:string };
/** Aprovação não recebe credencial, booleano, token ou variável de ambiente da IA. */
export async function solicitarAprovacao(escopo:EscopoAprovacao):Promise<{ subject:string; method:string; scopeHash:string; at:string } | null> {
  if (process.platform !== 'win32') return null;
  const sistema = process.env.SystemRoot;
  if (!sistema || !path.isAbsolute(sistema)) return null;
  const broker = fileURLToPath(new URL('./aprovar.exe',import.meta.url));
  await fs.access(broker);
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
