/** Consolida os fragmentos visuais por tela sem mudar um byte dos bundles executados pelo Electron. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const raiz = process.cwd();
const aplicar = process.argv.includes('--aplicar');
const rel = (p) => path.join(raiz, p);
const manifestoPath = 'ferramentas/frontend/telas-modulares.json';
const testePath = 'testes/arquitetura-telas.test.mjs';
const somar = (valores) => valores.reduce((a, b) => a + b, 0);
const conteudo = (p) => fs.readFileSync(rel(p), 'utf8');
const corpo = (texto, arquivo) => {
  if (!/^\/\*\* [^\r\n]+\. \*\/\r?\n/.test(texto)) {
    throw new Error('Primeira frase inválida em ' + arquivo);
  }
  return texto.slice(texto.indexOf('\n') + 1);
};
const manifestoAnterior = conteudo(manifestoPath);
const manifesto = JSON.parse(manifestoAnterior);
if (manifesto.schemaVersion !== 1 || !Array.isArray(manifesto.bundles)) {
  throw new Error('Manifesto desconhecido; nenhuma mudança realizada.');
}
const criados = new Map();
const antigos = new Set();
const novosBundles = [];
let totalAnterior = 0;
for (const bundle of manifesto.bundles) {
  const origens = bundle.origens;
  if (!Array.isArray(origens) || !origens.length) throw new Error('Bundle vazio: ' + bundle.destino);
  const original = origens.map(p => corpo(conteudo(p), p)).join('');
  if (conteudo(bundle.destino) !== original) {
    throw new Error('Bundle já divergente: ' + bundle.destino + '; rode npm run build antes.');
  }
  totalAnterior += origens.length;
  const grupos = [];
  for (const p of origens) {
    const partes = p.split('/');
    if (partes[0] !== 'frontend' || partes.length < 3 || !p.includes('.parte.')) {
      throw new Error('Caminho não é fragmento do frontend: ' + p);
    }
    const modulo = partes[1];
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.modulo === modulo) ultimo.origens.push(p);
    else grupos.push({ modulo, origens: [p] });
  }
  const nome = path.posix.basename(bundle.destino).replace(/\.(js|css)$/, '');
  const extensao = path.posix.extname(bundle.destino);
  const novos = grupos.map((g, i) => {
    const destino = 'frontend/' + g.modulo + '/' + nome + '-trecho-' + String(i + 1).padStart(2, '0') + '.parte' + extensao;
    if (fs.existsSync(rel(destino)) || criados.has(destino)) {
      throw new Error('Destino ocupado: ' + destino);
    }
    const texto = '/** Reúne trecho visual da função ' + g.modulo + ' para o bundle ' + nome + '. */\n' +
      g.origens.map(p => corpo(conteudo(p), p)).join('');
    criados.set(destino, texto);
    for (const p of g.origens) antigos.add(p);
    return destino;
  });
  const reconstruido = novos.map(p => corpo(criados.get(p), p)).join('');
  if (reconstruido !== original) throw new Error('Conteúdo mudou ao agrupar: ' + bundle.destino);
  novosBundles.push({ ...bundle, origens: novos });
}
const destinoTeste = conteudo(testePath);
const regraAntiga = "assert.ok(bundle.origens.length > 5, 'número de partes de '+bundle.destino);";
const regraNova = "assert.ok(bundle.origens.length > 0, 'bundle sem fontes: '+bundle.destino);";
if (!destinoTeste.includes(regraAntiga)) throw new Error('Teste de arquitetura mudou; reveja antes de migrar.');
const novosManifesto = JSON.stringify({ ...manifesto, bundles: novosBundles }, null, 2) + '\n';
const depois = somar(novosBundles.map(b => b.origens.length));
console.log('Frontend visual: ' + totalAnterior + ' fragmentos -> ' + depois + ' blocos por tela, sem mudar os bundles.');
for (const b of novosBundles) console.log('  ' + b.destino + ': ' + b.origens.length + ' blocos.');
if (!aplicar) {
  console.log('Prévia apenas. Para aplicar: node <arquivo> --aplicar');
  process.exit(0);
}
const status = execFileSync('git', ['status', '--porcelain'], { cwd: raiz, encoding: 'utf8' });
if (status.trim()) throw new Error('Git tem alterações; guarde-as antes da migração.\n' + status);
const historico = new Map();
const gravar = (p, valor) => {
  if (!historico.has(p)) historico.set(p, fs.existsSync(rel(p)) ? fs.readFileSync(rel(p)) : null);
  fs.mkdirSync(path.dirname(rel(p)), { recursive: true });
  fs.writeFileSync(rel(p), valor);
};
const excluir = (p) => {
  if (!historico.has(p)) historico.set(p, fs.existsSync(rel(p)) ? fs.readFileSync(rel(p)) : null);
  fs.rmSync(rel(p));
};
try {
  for (const [p, texto] of criados) {
    gravar(p, texto);
    gravar('dist/renderer/telas/' + p.slice('frontend/'.length), texto);
  }
  for (const p of antigos) {
    excluir(p);
    excluir('dist/renderer/telas/' + p.slice('frontend/'.length));
  }
  gravar(manifestoPath, novosManifesto);
  gravar(testePath, destinoTeste.replace(regraAntiga, regraNova));
  for (const [p, texto] of criados) if (conteudo(p) !== texto) throw new Error('Escrita divergente: ' + p);
  for (const b of novosBundles) {
    const gerado = b.origens.map(p => corpo(conteudo(p), p)).join('');
    if (conteudo(b.destino) !== gerado) throw new Error('Bundle alterado: ' + b.destino);
  }
  for (const args of [
    ['ferramentas/frontend/sincronizar-frontend.mjs', '--check'],
    ['ferramentas/frontend/gerar-telas-modulares.mjs', '--check'],
    ['ferramentas/frontend/verificar-modulos.mjs'],
  ]) execFileSync(process.execPath, args, { cwd: raiz, stdio: 'inherit' });
  console.log('MIGRAÇÃO CONCLUÍDA: fontes consolidadas e cópias Electron sincronizadas.');
  console.log('Revise o git diff e execute npm.cmd run check antes de qualquer commit.');
} catch (erro) {
  for (const [p, valor] of [...historico].reverse()) {
    if (valor === null) fs.rmSync(rel(p), { force: true });
    else { fs.mkdirSync(path.dirname(rel(p)), { recursive: true }); fs.writeFileSync(rel(p), valor); }
  }
  console.error('Alterações revertidas após falha: ' + erro.message);
  process.exitCode = 1;
}
