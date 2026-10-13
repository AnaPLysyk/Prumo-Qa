/** Sincroniza os módulos oficiais de frontend/ com as cópias de execução da janela Electron. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origem = path.join(raiz, 'frontend');
const destino = path.join(raiz, 'app/renderer/telas');
const somenteConferir = process.argv.includes('--check');

function arquivosDentro(pasta, base = pasta) {
  if (!fs.existsSync(pasta)) throw new Error('Pasta ausente: ' + pasta);
  const arquivos = [];
  for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
    const absoluto = path.join(pasta, item.name);
    if (item.isSymbolicLink()) throw new Error('Links nao sao permitidos nos modulos: ' + absoluto);
    if (item.isDirectory()) arquivos.push(...arquivosDentro(absoluto, base));
    else if (item.isFile()) arquivos.push(path.relative(base, absoluto));
  }
  return arquivos.sort();
}

const manifesto = JSON.parse(fs.readFileSync(path.join(origem, 'recursos.json'), 'utf8'));
if (manifesto.schemaVersion !== 1 || !Array.isArray(manifesto.recursos)) throw new Error('Manifesto de recursos inválido');
const recursos = manifesto.recursos;
const fontesMapeadas = new Set(); const destinosMapeados = new Set();
for (const recurso of recursos) {
  if (typeof recurso.fonte !== 'string' || typeof recurso.destino !== 'string' ||
      !/^frontend\/(?:[\w-]+\/)+[\w.-]+\.(?:js|css|html)$/.test(recurso.fonte) ||
      !/^app\/renderer\/[\w.-]+\.(?:js|css|html)$/.test(recurso.destino)) throw new Error('Caminho de recurso inválido');
  if (fontesMapeadas.has(recurso.fonte) || destinosMapeados.has(recurso.destino)) throw new Error('Recurso duplicado: ' + recurso.fonte);
  fontesMapeadas.add(recurso.fonte); destinosMapeados.add(recurso.destino);
}
const distribuivel = arquivo => /\.(js|css|html)$/.test(arquivo);
const fontes = arquivosDentro(origem).filter(arquivo => distribuivel(arquivo) && !fontesMapeadas.has('frontend/' + arquivo.split(path.sep).join('/')));
const copias = arquivosDentro(destino).filter(distribuivel);
const diferencas = [];
const fontesSet = new Set(fontes);
for (const arquivo of copias) if (!fontesSet.has(arquivo)) diferencas.push('Copia sem fonte oficial: ' + arquivo);
for (const arquivo of fontes) {
  const a = path.join(origem, arquivo);
  const b = path.join(destino, arquivo);
  const mesma = fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));
  if (mesma) continue;
  if (somenteConferir) diferencas.push('Copia divergente: ' + arquivo);
  else {
    fs.mkdirSync(path.dirname(b), { recursive: true });
    fs.copyFileSync(a, b);
    console.log('SINCRONIZADO: ' + arquivo);
  }
}
// Recursos transversais preservam os caminhos e a ordem de carga públicos do Electron.
for (const recurso of recursos) {
  const a = path.join(raiz, recurso.fonte);
  const b = path.join(raiz, recurso.destino);
  if (!fs.existsSync(a)) { diferencas.push('Fonte de recurso ausente: ' + recurso.fonte); continue; }
  if (fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))) continue;
  if (somenteConferir) diferencas.push('Copia de recurso divergente: ' + recurso.destino);
  else {
    fs.copyFileSync(a, b);
    console.log('SINCRONIZADO: ' + recurso.fonte);
  }
}
if (diferencas.length) {
  diferencas.forEach(d => console.error('ERRO: ' + d));
  process.exitCode = 1;
} else {
  console.log('OK: ' + fontes.length + ' arquivos de telas e ' + recursos.length + ' recursos correspondem as copias do Electron.');
}
