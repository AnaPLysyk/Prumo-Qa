/** Procura o CLI do Codex ou do Claude instalado neste computador. */
import fs from 'node:fs';
import path from 'node:path';

export function localizarClienteDeIa(cliente:'codex'|'claude') {
  const pastas=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d));
  // Instalação oficial do Codex Desktop também oferece CLI fora do PATH.
  if(cliente==='codex'&&process.platform==='win32'&&process.env.LOCALAPPDATA) {
    const pasta=path.join(process.env.LOCALAPPDATA,'OpenAI','Codex','bin');
    try { for(const d of fs.readdirSync(pasta).sort().reverse())pastas.push(path.join(pasta,d)); } catch { /* Não instalado aqui. */ }
  }
  let shim:string|undefined;
  for(const d of pastas)for(const ext of process.platform==='win32'?['.exe','.cmd']:['']) {
    const exe=path.join(d,cliente+ext);
    try { if(fs.statSync(exe).isFile()) {if(ext==='.cmd')shim??=exe;else return {executable:exe,shim:false};} } catch { /* Próximo diretório explícito do PATH. */ }
  }
  return shim?{executable:shim,shim:true}:null;
}
