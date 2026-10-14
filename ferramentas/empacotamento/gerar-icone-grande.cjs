// Gera assets/prumo-icon-1024.png (ícone do macOS e do Linux, que exigem 512 px ou mais) a partir de assets/prumo-icon.png.
// Roda dentro do Electron: npx electron ferramentas/empacotamento/gerar-icone-grande.cjs
const { app, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.whenReady().then(() => {
  const raiz = path.resolve(__dirname, '../..');
  const origem = nativeImage.createFromPath(path.join(raiz, 'assets', 'prumo-icon.png'));
  fs.writeFileSync(path.join(raiz, 'assets', 'prumo-icon-1024.png'), origem.resize({ width: 1024, height: 1024, quality: 'best' }).toPNG());
  console.log('assets/prumo-icon-1024.png gerado');
  app.quit();
});
