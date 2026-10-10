// Gera o ícone PROVISÓRIO (prumo: fio + peso) sem dependências: assets/prumo-icon.png e .ico.
// Para usar sua própria identidade, substitua os dois arquivos em assets/ e rode `npm run dist`.
// Este script só deve ser executado se você quiser regenerar o provisório (npm run icone).
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTabela = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTabela[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function bloco(tipo, dados) {
  const t = Buffer.from(tipo); const n = Buffer.alloc(4); n.writeUInt32BE(dados.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, dados]))); return Buffer.concat([n, t, dados, c]);
}
function png(tam) {
  const SS = 4; const linhas = [];
  const dentroRaio = (x, y, r) => { const cx = Math.min(Math.max(x, r), 1 - r), cy = Math.min(Math.max(y, r), 1 - r); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; };
  const amostra = (x, y) => {
    if (!dentroRaio(x, y, 0.2)) return [0, 0, 0, 0];
    // fio (linha vertical) e peso (losango) do prumo
    if (Math.abs(x - 0.5) < 0.022 && y > 0.14 && y < 0.5) return [230, 233, 238, 255];
    const dx = Math.abs(x - 0.5) / 0.2, dy = Math.abs(y - 0.66) / 0.3;
    if (dx + dy <= 1) return [94, 182, 166, 255];
    if (y < 0.17 && y > 0.12 && Math.abs(x - 0.5) < 0.1) return [230, 233, 238, 255];
    return [27, 31, 38, 255];
  };
  for (let y = 0; y < tam; y++) {
    const linha = Buffer.alloc(1 + tam * 4);
    for (let x = 0; x < tam; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) { const p = amostra((x + (sx + 0.5) / SS) / tam, (y + (sy + 0.5) / SS) / tam); r += p[0] * p[3]; g += p[1] * p[3]; b += p[2] * p[3]; a += p[3]; }
      const n = SS * SS; const o = 1 + x * 4;
      if (a) { linha[o] = r / a; linha[o + 1] = g / a; linha[o + 2] = b / a; linha[o + 3] = a / n; }
    }
    linhas.push(linha);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(tam, 0); ihdr.writeUInt32BE(tam, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco('IHDR', ihdr), bloco('IDAT', deflateSync(Buffer.concat(linhas))), bloco('IEND', Buffer.alloc(0))]);
}
function ico(tamanhos) {
  const imagens = tamanhos.map((t) => ({ t, dados: png(t) }));
  const cab = Buffer.alloc(6); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(imagens.length, 4);
  let deslocamento = 6 + 16 * imagens.length; const dir = [];
  for (const { t, dados } of imagens) {
    const e = Buffer.alloc(16); e[0] = t >= 256 ? 0 : t; e[1] = t >= 256 ? 0 : t; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(dados.length, 8); e.writeUInt32LE(deslocamento, 12); deslocamento += dados.length; dir.push(e);
  }
  return Buffer.concat([cab, ...dir, ...imagens.map((i) => i.dados)]);
}
mkdirSync('assets', { recursive: true });
writeFileSync('assets/prumo-icon.png', png(512));
writeFileSync('assets/prumo-icon.ico', ico([16, 24, 32, 48, 64, 128, 256]));
console.log('Ícone provisório gerado em assets/.');
