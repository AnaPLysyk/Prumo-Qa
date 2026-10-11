import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Compila o broker de aprovação humana do Windows (aprovar.exe) e confirma que o sistema CONSEGUE executá-lo.
 * - Incremental: só recompila quando o fonte (aprovar.cs) ou o comando de compilação mudam. Recriar um executável novo e sem
 *   assinatura a cada build o expunha, no primeiro uso, à varredura do Windows (Defender/Smart App Control), que às vezes o
 *   recusa por instantes (spawn UNKNOWN) e fazia o teste do broker falhar de forma intermitente.
 * - Prontidão: depois de compilar, executa o broker com uma entrada SEM escopo (que ele deve recusar com código 1, sem pedir
 *   senha) e espera o sistema liberar a primeira execução. Nada é desativado nem contornado: se o Windows seguir recusando o
 *   executável, o build avisa claramente (e falha no CI), porque a execução protegida ficaria BLOCKED.
 */
if (process.platform === 'win32') {
  const output = path.resolve('dist/aprovar.exe'); const fonte = path.resolve('scripts/aprovar.cs'); const carimbo = output + '.fonte.sha256';
  // Caminhos locais escolhidos pelo build, escapados para literals PowerShell; sem entrada de prompt.
  const literal = (s) => "'" + s.replaceAll("'", "''") + "'";
  const command = `$ErrorActionPreference='Stop'; Add-Type -Path ${literal(fonte)} -ReferencedAssemblies 'System.dll','System.Core.dll','System.Web.Extensions.dll' -OutputAssembly ${literal(output)} -OutputType ConsoleApplication`;
  const assinatura = createHash('sha256').update(readFileSync(fonte)).update('\n').update(command.replaceAll(output, 'SAIDA').replaceAll(fonte, 'FONTE')).digest('hex');
  if (existsSync(output) && existsSync(carimbo) && readFileSync(carimbo, 'utf8').trim() === assinatura) {
    console.log('Broker Windows já compilado (fonte inalterada); mantido o mesmo executável.');
  } else {
    rmSync(output, { force: true }); rmSync(carimbo, { force: true });
    const r = spawnSync(path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(command, 'utf16le').toString('base64')], { encoding: 'utf8', windowsHide: true });
    if (r.status !== 0) { process.stderr.write(r.stderr || 'Falha de compilação do broker Windows.'); process.exit(r.status || 1); }
    writeFileSync(carimbo, assinatura + '\n');
    console.log('Broker Windows compilado. Sem alteração de ExecutionPolicy.');
  }
  // Prontidão: o broker precisa recusar (código 1, sem saída) uma entrada sem escopo. Qualquer outro resultado = o sistema não o executou.
  let ultimo = null; let pronto = false;
  for (let tentativa = 1; tentativa <= 20 && !pronto; tentativa++) {
    const r = spawnSync(output, [], { input: JSON.stringify({ approved: true }), encoding: 'utf8', windowsHide: true, timeout: 15000 });
    ultimo = r.error ? `${r.error.code ?? r.error.message} (errno ${r.error.errno})` : `código ${r.status}`;
    pronto = !r.error && r.status === 1 && r.stdout === '';
    if (!pronto) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  if (!pronto) {
    const msg = `AVISO: o Windows não executou ${output} (${ultimo}) em 20 tentativas. Smart App Control, Defender ou política local podem estar bloqueando executáveis novos sem assinatura. O Prumo NÃO contorna isso: a execução protegida ficará BLOCKED até o sistema permitir o broker.\n`;
    process.stderr.write(msg); if (process.env.CI) process.exit(1);
  } else console.log('Broker Windows executável e recusando entrada sem escopo (verificado).');
}
