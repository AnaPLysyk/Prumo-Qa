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

const fontes = arquivosDentro(origem);
const copias = arquivosDentro(destino);
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
if (diferencas.length) {
  diferencas.forEach(d => console.error('ERRO: ' + d));
  process.exitCode = 1;
} else {
  console.log('OK: ' + fontes.length + ' arquivos de frontend/ correspondem as copias do Electron.');
}
