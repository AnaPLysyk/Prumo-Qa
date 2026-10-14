/** Qual instalador serve a este computador: Windows, macOS (Apple Silicon ou Intel) ou Linux (AppImage ou .deb). */

export type PlataformaDoInstalador = 'win' | 'mac-arm64' | 'mac-x64' | 'linux-appimage' | 'linux-deb';

/** Devolve null onde não há instalador oficial (por exemplo Linux em ARM): a atualização automática fica indisponível. */
export function plataformaDoInstalador(sistema: string = process.platform, arquitetura: string = process.arch, ambiente: NodeJS.ProcessEnv = process.env): PlataformaDoInstalador | null {
  if (sistema === 'win32') return arquitetura === 'x64' ? 'win' : null;
  if (sistema === 'darwin') return arquitetura === 'arm64' ? 'mac-arm64' : arquitetura === 'x64' ? 'mac-x64' : null;
  if (sistema === 'linux' && arquitetura === 'x64') return ambiente.APPIMAGE ? 'linux-appimage' : 'linux-deb';
  return null;
}
