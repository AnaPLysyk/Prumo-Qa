/** Monta o comando de conexão para PowerShell (Windows) ou shell POSIX (macOS/Linux). */

/** As aspas escapam apóstrofos sem interpretar argumentos como comandos. */
const aspasDoPowershell = (texto: string) => "'" + texto.replaceAll("'", "''") + "'";
const aspasDoShell = (texto: string) => "'" + texto.replaceAll("'", "'\\''") + "'";

export function comandoParaOTerminal(executavel: string, args: string[], sistema: string = process.platform): string {
  if (sistema === 'win32') {
    return `& ${aspasDoPowershell(executavel)} ${args.map(aspasDoPowershell).join(' ')}`;
  }
  return [executavel, ...args].map(aspasDoShell).join(' ');
}
