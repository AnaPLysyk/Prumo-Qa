// Executa UM grupo da suíte do Prumo QA pelo contrato do próprio Prumo (qa.project.json): o Prumo testa o Prumo.
// O grupo vem de PRUMO_QA_GRUPO (o contrato não aceita flags: cada argumento de um comando node é um arquivo do escopo).
// Grupos: nucleo (sem janela; inclui contratos e integração) e janela-1..3 (Electron real).
// Arquivos de teste novos entram sozinhos: os de janela são distribuídos em rodízio pela ordem alfabética.
// Requer o build atual (capacidade "build"). Uso local: PRUMO_QA_GRUPO=unidade node ferramentas/qa/qa-suite.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { casoDoNode } from '../../backend/testes/reporters/prumo-node-reporter.mjs';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(repo);
const pedido = process.env.PRUMO_QA_GRUPO ?? '';
const grupo = pedido === 'unidade' ? 'nucleo' : pedido; // Alias para contratos anteriores.
const todos = fs.readdirSync('testes', { recursive: true }).map(String).filter((n) => n.endsWith('.test.mjs')).map((n) => n.replaceAll('\\', '/')).sort();
const abreJanela = (n) => /janela\.mjs|_electron/.test(fs.readFileSync(path.join('testes', n), 'utf8'));
const janela = todos.filter(abreJanela);
const grupos = { nucleo: todos.filter((n) => !abreJanela(n)) };
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
createRequire(import.meta.url)('../../testes/apoio/conhecimento-hook.cjs');
console.log(`Prumo QA · grupo ${grupo}: ${grupos[grupo].length} arquivo(s)\n${grupos[grupo].join('\n')}\n`);
let falhas = 0;
const casos = [];
const registrar = (e, status) => {
  const caso = casoDoNode(e, status, { raiz: repo, grupo, indice: casos.length });
  if (caso) casos.push(caso);
};
const fluxo = run({ files: grupos[grupo].map((n) => path.join(repo, 'testes', n)), concurrency: 1, execArgv: ['--experimental-test-module-mocks'] })
  .on('test:pass', (e) => registrar(e, 'PASS'))
  .on('test:fail', (e) => { if (e.details?.type !== 'suite') { falhas++; registrar(e, 'FAIL'); } });
fluxo.compose(spec).pipe(process.stdout);
fluxo.on('end', () => {
  try {
    if (process.env.PRUMO_JOB_ID && process.env.PRUMO_RESULT_FILE) {
      fs.writeFileSync(process.env.PRUMO_RESULT_FILE, JSON.stringify({ jobId: process.env.PRUMO_JOB_ID, cases: casos }), { flag: 'wx' });
    }
    process.exitCode = falhas ? 1 : 0;
  } catch (erro) { console.error('Falha ao registrar resultados individuais:', erro.message); process.exitCode = 1; }
});
