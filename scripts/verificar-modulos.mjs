/** Verifica se módulos movidos continuam acessíveis pelos imports antigos. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pares = [
  ['src/rastreabilidade.ts','src/modulos/rastreabilidade/mapaDeVinculos.ts'],
  ['src/rotasEscrita.ts','src/modulos/conexoes/rotaEscritaPermitida.ts'],
  ['src/playwright.ts','src/modulos/testes/converterRelatorioPlaywright.ts'],
  ['src/adf.ts','src/modulos/tickets/textoParaAdf.ts'],
  ['src/multipart.ts','src/modulos/conexoes/montarMultipart.ts'],
  ['src/qualidade.ts','src/modulos/testes/revisarCobertura.ts'],
  ['src/diagnostico.ts','src/modulos/logs/diagnosticoIpc.ts'],
  ['src/textosDesktop.ts','src/modulos/configuracoes/textosDesktop.ts'],
];
const falhas = [];
for (const [antigo, atual] of pares) {
  const origem = path.join(raiz, antigo);
  const destino = path.join(raiz, atual);
  if (!fs.existsSync(origem) || !fs.existsSync(destino)) {
    falhas.push(antigo + ': ponte ou implementação ausente');
    continue;
  }
  const textoAntigo = fs.readFileSync(origem,'utf8');
  const textoNovo = fs.readFileSync(destino,'utf8');
  if (!textoAntigo.startsWith('/** ') || !textoNovo.startsWith('/** ')) falhas.push(atual + ': falta descrição inicial');
  const importEsperado = './' + atual.slice(4).replace(/\.ts$/, '.js');
  if (!textoAntigo.includes("export * from '" + importEsperado + "'")) falhas.push(antigo + ': reexportação incorreta');
  for (const [, importRelativo] of textoNovo.matchAll(/\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const alvo = path.resolve(path.dirname(destino), importRelativo.replace(/\.js$/,'.ts'));
    if (!fs.existsSync(alvo) && !fs.existsSync(path.resolve(path.dirname(destino),importRelativo))) {
      falhas.push(atual + ': import inexistente: ' + importRelativo);
    }
  }
}
if (falhas.length) {
  for (const falha of falhas) console.error('ERRO:',falha);
  process.exitCode = 1;
} else {
  console.log('OK: oito implementações modulares, oito pontes e imports relativos conferidos.');
  console.log('Isto não substitui npm run check, Electron ou testes MCP.');
}
