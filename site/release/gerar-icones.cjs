// Gera os ícones do Prumo a partir da esfera (assets/qc-orb.png): prumo-icon.png e .ico (Windows) e prumo-icon-1024.png
// (macOS e Linux, que exigem 512 px ou mais). Roda dentro do Electron (usa nativeImage): npm run icone
const { app, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.whenReady().then(() => {
  const raiz = path.resolve(__dirname, '../..');
  const orig = nativeImage.createFromPath(path.join(raiz, 'assets', 'qc-orb.png'));
  const { width, height } = orig.getSize(); const bmp = orig.toBitmap(); // BGRA
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (bmp[(y * width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const lado = Math.max(x1 - x0 + 1, y1 - y0 + 1); const folga = Math.round(lado * 0.06);
  const cx = Math.round((x0 + x1) / 2), cy = Math.round((y0 + y1) / 2); const meio = Math.round(lado / 2) + folga;
  const rx = Math.max(0, cx - meio), ry = Math.max(0, cy - meio); const tam = Math.min(meio * 2, width - rx, height - ry);
  const quadrada = orig.crop({ x: rx, y: ry, width: tam, height: tam });
  const tamanhos = [16, 24, 32, 48, 64, 128, 256]; const pngs = tamanhos.map((t) => quadrada.resize({ width: t, height: t, quality: 'best' }).toPNG());
  const icone = quadrada.resize({ width: 256, height: 256, quality: 'best' });
  fs.writeFileSync(path.join(raiz, 'assets', 'prumo-icon.png'), icone.toPNG());
  fs.writeFileSync(path.join(raiz, 'assets', 'prumo-icon-1024.png'), icone.resize({ width: 1024, height: 1024, quality: 'best' }).toPNG());
  // ICO com PNGs embutidos (Windows Vista+): cabeçalho + entradas + dados
  const cab = Buffer.alloc(6); cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(tamanhos.length, 4);
  let desloc = 6 + 16 * tamanhos.length; const entradas = [];
  tamanhos.forEach((t, i) => { const e = Buffer.alloc(16); e[0] = t >= 256 ? 0 : t; e[1] = t >= 256 ? 0 : t; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(desloc, 12); desloc += pngs[i].length; entradas.push(e); });
  fs.writeFileSync(path.join(raiz, 'assets', 'prumo-icon.ico'), Buffer.concat([cab, ...entradas, ...pngs]));
  console.log('Ícones gerados a partir da esfera', { recorte: { rx, ry, tam } });
  app.quit();
});
