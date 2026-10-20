/** Gera a interface do Electron (dist/renderer, não versionada) a partir da fonte única em frontend/; com --check só confere. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origem = path.join(raiz, 'frontend');
const destino = path.join(raiz, 'dist/renderer/telas');
const somenteConferir = process.argv.includes('--check');
// Num clone novo a pasta ainda não existe: gerar cria; conferir sem ter gerado é erro.
if (!somenteConferir) fs.mkdirSync(destino, { recursive: true });

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
      !/^frontend\/(?:[\w-]+\/)+[\w.-]+\.(?:js|css|html|txt)$/.test(recurso.fonte) ||
      !/^dist\/renderer\/(?:vendor\/)?[\w.-]+\.(?:js|css|html|txt)$/.test(recurso.destino)) throw new Error('Caminho de recurso inválido');
  if (fontesMapeadas.has(recurso.fonte) || destinosMapeados.has(recurso.destino)) throw new Error('Recurso duplicado: ' + recurso.fonte);
  fontesMapeadas.add(recurso.fonte); destinosMapeados.add(recurso.destino);
}
const distribuivel = arquivo => /\.(js|css|html)$/.test(arquivo) && !/(^|[\\/])web[\\/]/.test(arquivo);
// As partes (*.parte.js|css) entram na janela só pelos bundles de telas-modulares.json; a cópia avulsa nunca seria carregada.
const parte = arquivo => /\.parte\.(js|css)$/.test(arquivo);
const fontes = arquivosDentro(origem).filter(arquivo => distribuivel(arquivo) && !parte(arquivo) && !fontesMapeadas.has('frontend/' + arquivo.split(path.sep).join('/')));
const copias = arquivosDentro(destino).filter(distribuivel);
const diferencas = [];
const fontesSet = new Set(fontes);
for (const arquivo of copias) {
  if (fontesSet.has(arquivo)) continue;
  // Cópia gerada que perdeu a fonte (arquivo renomeado ou removido): ao gerar, some; ao conferir, é erro.
  if (somenteConferir) diferencas.push('Copia sem fonte oficial: ' + arquivo);
  else { fs.rmSync(path.join(destino, arquivo)); console.log('REMOVIDO: ' + arquivo); }
}
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
    fs.mkdirSync(path.dirname(b), { recursive: true });
    fs.copyFileSync(a, b);
    console.log('SINCRONIZADO: ' + recurso.fonte);
  }
}
// Na raiz de dist/renderer só ficam os recursos declarados, os bundles e o status.css (gerar-status.mjs).
// Arquivo de um nome antigo (renomeado ou removido): ao gerar, some; ao conferir, é erro.
const raizDaJanela = path.join(raiz, 'dist/renderer');
const bundles = JSON.parse(fs.readFileSync(path.join(raiz, 'frontend/construcao/telas-modulares.json'), 'utf8')).bundles.map(b => b.destino);
const permitidos = new Set([...recursos.map(r => r.destino), ...bundles, 'dist/renderer/status.css']);
for (const item of fs.existsSync(raizDaJanela) ? fs.readdirSync(raizDaJanela, { withFileTypes: true }) : []) {
  const relativo = 'dist/renderer/' + item.name;
  if (!item.isFile() || !distribuivel(item.name) || permitidos.has(relativo)) continue;
  if (somenteConferir) diferencas.push('Arquivo antigo na raiz da janela: ' + relativo);
  else { fs.rmSync(path.join(raizDaJanela, item.name)); console.log('REMOVIDO: ' + relativo); }
}
if (diferencas.length) {
  diferencas.forEach(d => console.error('ERRO: ' + d));
  process.exitCode = 1;
} else {
  console.log('OK: ' + fontes.length + ' arquivos de telas e ' + recursos.length + ' recursos correspondem as copias do Electron.');
}
