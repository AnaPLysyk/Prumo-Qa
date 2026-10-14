// Instaladores oficiais de uma versão e os nomes dos arquivos (os mesmos que o electron-builder gera e o aplicativo baixa).
// Fonte única do site; o teste testes/unitario/regras/multiplataforma.test.mjs confere que bate com o aplicativo.
export const instaladoresDaVersao = (v) => [
  { id: 'win', sistema: 'Windows', detalhe: '10 ou 11, 64 bits', arquivo: `Prumo-QA-Setup-${v}.exe`, obrigatorio: true },
  { id: 'mac-arm64', sistema: 'macOS', detalhe: 'Apple Silicon (M1 ou mais novo)', arquivo: `Prumo-QA-${v}-mac-arm64.dmg` },
  { id: 'mac-x64', sistema: 'macOS', detalhe: 'Intel', arquivo: `Prumo-QA-${v}-mac-x64.dmg` },
  { id: 'linux-appimage', sistema: 'Linux', detalhe: 'AppImage, qualquer distribuição, 64 bits', arquivo: `Prumo-QA-${v}-linux-x86_64.AppImage` },
  { id: 'linux-deb', sistema: 'Linux', detalhe: 'pacote .deb (Debian, Ubuntu), 64 bits', arquivo: `Prumo-QA-${v}-linux-amd64.deb` },
];
