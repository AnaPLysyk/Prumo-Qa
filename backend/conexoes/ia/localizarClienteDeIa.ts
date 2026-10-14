/** Procura o CLI do Codex ou do Claude instalado neste computador. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function localizarClienteDeIa(cliente:'codex'|'claude') {
  const pastas=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d));
  // Instalação oficial do Codex Desktop também oferece CLI fora do PATH.
  if(cliente==='codex'&&process.platform==='win32'&&process.env.LOCALAPPDATA) {
    const pasta=path.join(process.env.LOCALAPPDATA,'OpenAI','Codex','bin');
    try { for(const d of fs.readdirSync(pasta).sort().reverse())pastas.push(path.join(pasta,d)); } catch { /* Não instalado aqui. */ }
  }
  // A extensão Claude Code do VS Code traz o claude.exe dentro da própria pasta, fora do PATH (usa a versão mais nova instalada).
  if(cliente==='claude'&&process.platform==='win32') {
    const extensoes=path.join(process.env.USERPROFILE??os.homedir(),'.vscode','extensions');
    try { for(const d of fs.readdirSync(extensoes).filter(n=>n.startsWith('anthropic.claude-code-')).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})))pastas.push(path.join(extensoes,d,'resources','native-binary')); } catch { /* VS Code não instalado aqui. */ }
  }
  // macOS e Linux: aplicativos abertos pelo Dock ou pelo menu recebem um PATH mínimo; procura também onde os CLIs costumam ficar.
  if(process.platform!=='win32') for(const d of ['.local/bin','.claude/local','.npm-global/bin','.bun/bin','.volta/bin'])pastas.push(path.join(os.homedir(),d));
  if(process.platform!=='win32') pastas.push('/usr/local/bin','/opt/homebrew/bin','/usr/bin','/snap/bin');
  let shim:string|undefined;
  for(const d of pastas)for(const ext of process.platform==='win32'?['.exe','.cmd']:['']) {
    const exe=path.join(d,cliente+ext);
    try { if(fs.statSync(exe).isFile()) {if(ext==='.cmd')shim??=exe;else return {executable:exe,shim:false};} } catch { /* Próximo diretório explícito do PATH. */ }
  }
  return shim?{executable:shim,shim:true}:null;
}
