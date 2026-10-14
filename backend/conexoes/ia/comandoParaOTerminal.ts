/** Monta o comando de conexão para colar no terminal: PowerShell no Windows, shell comum (aspas simples) no macOS e no Linux. */
import { aspasDoPowershell } from './aspasDoPowershell.js';

/** Aspas simples do shell POSIX: o apóstrofo vira '\'' e nada mais é interpretado. */
export const aspasDoShell = (s: string) => "'" + s.replaceAll("'", "'\\''") + "'";

export function comandoParaOTerminal(executavel: string, args: string[], sistema: string = process.platform): string {
  if (sistema === 'win32') return `& ${aspasDoPowershell(executavel)} ${args.map(aspasDoPowershell).join(' ')}`;
  return [executavel, ...args].map(aspasDoShell).join(' ');
}
