/** Monta os scripts tradicionais da janela a partir das partes organizadas por tela. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifesto = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts/telas-modulares.json'), 'utf8'));
const conferir = process.argv.includes('--check');
let falhas = 0;
for (const bundle of manifesto.bundles) {
  const destino = path.join(raiz, bundle.destino);
  const conteudo = bundle.origens.map((origem) => {
    const texto = fs.readFileSync(path.join(raiz, origem), 'utf8');
    if (!texto.startsWith('/** ')) throw new Error('Falta frase de responsabilidade em ' + origem);
    const quebra = texto.indexOf('\n');
    if (quebra < 0) throw new Error('Fragmento incompleto: ' + origem);
    return texto.slice(quebra + 1);
  }).join('');
  const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  if (conferir && atual !== conteudo) {
    console.error('DIFERENCA: ' + bundle.destino + ' nao corresponde as partes por tela.');
    falhas++;
  } else if (!conferir && atual !== conteudo) {
    fs.writeFileSync(destino, conteudo, 'utf8');
    console.log('GERADO: ' + bundle.destino);
  } else {
    console.log('OK: ' + bundle.destino + ' (' + bundle.origens.length + ' partes)');
  }
}
if (falhas) process.exitCode = 1;
