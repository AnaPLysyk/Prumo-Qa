/** Antes do tsc, apaga do dist/ os compilados do backend (.js, .d.ts, .js.map) cuja fonte .ts não existe mais. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// renderer/ vem das ferramentas de frontend e documentacao/ do mapa da Documentação Viva; aprovar.exe e o carimbo ficam
// porque não são compilados (recompilar o broker o expõe de novo ao Smart App Control). Compilados com fonte não são
// apagados: o tsc os sobrescreve, e um aplicativo aberto a partir do dist/ não perde módulos no meio do build.
const preservadas = new Set(['renderer', 'documentacao']);
const fonteDoCompilado = (nome) => /^(.+?)(\.d\.ts|\.js\.map|\.js)$/.exec(nome)?.[1];

export function limparCompilados(dist, backend) {
  if (path.basename(dist) !== 'dist') throw new Error('Limpeza recusada: só a pasta dist/ pode ser limpa (' + dist + ').');
  const apagados = [];
  const limpar = (pasta) => {
    for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
      const caminho = path.join(pasta, item.name);
      const relativo = path.relative(dist, caminho);
      if (item.isDirectory()) {
        if (pasta === dist && preservadas.has(item.name)) continue;
        limpar(caminho);
        if (fs.readdirSync(caminho).length === 0) fs.rmdirSync(caminho);
        continue;
      }
      const fonte = fonteDoCompilado(item.name);
      if (fonte === undefined || fs.existsSync(path.join(backend, path.dirname(relativo), fonte + '.ts'))) continue;
      fs.rmSync(caminho);
      apagados.push(relativo.split(path.sep).join('/'));
    }
  };
  if (fs.existsSync(dist)) limpar(dist);
  return apagados;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const apagados = limparCompilados(path.join(raiz, 'dist'), path.join(raiz, 'backend'));
  console.log(`Compilados sem fonte apagados do dist/: ${apagados.length}.`);
}
