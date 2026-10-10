import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
if(process.platform==='win32'){
  const output=path.resolve('dist/aprovar.exe');rmSync(output,{force:true});
  // Caminhos locais escolhidos pelo build, escapados para literals PowerShell; sem entrada de prompt.
  const literal=s=>"'"+s.replaceAll("'","''")+"'";
  const command=`$ErrorActionPreference='Stop'; Add-Type -Path ${literal(path.resolve('scripts/aprovar.cs'))} -ReferencedAssemblies 'System.dll','System.Core.dll','System.Web.Extensions.dll' -OutputAssembly ${literal(output)} -OutputType ConsoleApplication`;
  const r=spawnSync(path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{encoding:'utf8',windowsHide:true});
  if(r.status!==0){process.stderr.write(r.stderr||'Falha de compilação do broker Windows.');process.exit(r.status||1);}
  console.log('Broker Windows compilado. Sem alteração de ExecutionPolicy.');
}
