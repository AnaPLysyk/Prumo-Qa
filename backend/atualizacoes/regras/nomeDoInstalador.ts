/** Nome do arquivo do instalador de uma versão, no mesmo padrão do electron-builder (electron-builder.yml) para cada sistema. */
import { PlataformaDoInstalador, plataformaDoInstalador } from './plataformaDoInstalador.js';

export function nomeDoInstalador(v: string, plataforma: PlataformaDoInstalador | null = plataformaDoInstalador()): string {
  switch (plataforma) {
    case 'win': return `Prumo-QA-Setup-${v}.exe`;
    case 'mac-arm64': return `Prumo-QA-${v}-mac-arm64.dmg`;
    case 'mac-x64': return `Prumo-QA-${v}-mac-x64.dmg`;
    case 'linux-appimage': return `Prumo-QA-${v}-linux-x86_64.AppImage`;
    case 'linux-deb': return `Prumo-QA-${v}-linux-amd64.deb`;
    default: throw new Error('UPDATE_UNSUPPORTED: não há instalador oficial para este sistema; baixe pela página de download.');
  }
}
