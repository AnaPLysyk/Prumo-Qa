// Executa UM grupo da suíte do Prumo QA pelo contrato do próprio Prumo (qa.project.json): o Prumo testa o Prumo.
// O grupo vem de PRUMO_QA_GRUPO (o contrato não aceita flags: cada argumento de um comando node é um arquivo do escopo).
// Grupos: unidade (sem janela) e janela-1..3 (Electron real), cada um abaixo do limite de 5 min por capacidade.
// Arquivos de teste novos entram sozinhos: os de janela são distribuídos em rodízio pela ordem alfabética.
// Requer o build atual (capacidade "build"). Uso local: PRUMO_QA_GRUPO=unidade node scripts/qa-suite.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repo);
const grupo = process.env.PRUMO_QA_GRUPO ?? '';
const todos = fs.readdirSync('testes', { recursive: true }).map(String).filter((n) => n.endsWith('.test.mjs')).map((n) => n.replaceAll('\\', '/')).sort();
const abreJanela = (n) => /janela\.mjs|_electron/.test(fs.readFileSync(path.join('testes', n), 'utf8'));
const janela = todos.filter(abreJanela);
const grupos = { unidade: todos.filter((n) => !abreJanela(n)) };
for (let g = 0; g < 3; g++) grupos[`janela-${g + 1}`] = janela.filter((_, i) => i % 3 === g);
if (!grupos[grupo]) { console.error(`PRUMO_QA_GRUPO inválido: "${grupo}". Use: ${Object.keys(grupos).join(', ')}.`); process.exit(2); }
if (!fs.existsSync('dist/cli.js')) { console.error('dist/ ausente: rode a capacidade "build" antes.'); process.exit(2); }

// O Prumo não repassa PATH ao executar uma capacidade (variável capaz de alterar o runtime). Alguns testes chamam o git:
// montamos um PATH FIXO e conhecido (Node atual, System32 e Git for Windows), como o próprio Prumo faz para o npm.
if (!process.env.PATH && process.platform === 'win32') {
  const fixos = [path.dirname(process.execPath), process.env.SystemRoot && path.join(process.env.SystemRoot, 'System32'), 'C:\\Program Files\\Git\\cmd'];
  process.env.PATH = fixos.filter((d) => d && fs.existsSync(d)).join(path.delimiter);
}
// Mesmo ambiente de `npm test`: conhecimento em memória (nunca o banco real) e mocks de módulo.
createRequire(import.meta.url)('../testes/conhecimento-hook.cjs');
console.log(`Prumo QA · grupo ${grupo}: ${grupos[grupo].length} arquivo(s)\n${grupos[grupo].join('\n')}\n`);
let falhas = 0;
const fluxo = run({ files: grupos[grupo].map((n) => path.join(repo, 'testes', n)), concurrency: 1, execArgv: ['--experimental-test-module-mocks'] })
  .on('test:fail', (e) => { if (e.details?.type !== 'suite') falhas++; });
fluxo.compose(spec).pipe(process.stdout);
fluxo.on('end', () => { process.exitCode = falhas ? 1 : 0; });
