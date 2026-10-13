/** Registra log, duração e código reais de uma verificação npm conhecida, sem shell nem publicação. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const comando = process.argv[2] ?? 'check';
if (!['check', 'dist', 'build'].includes(comando) || process.argv.length > 3) throw new Error('Use verificar.mjs check|dist|build');
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
if (!fs.existsSync(npm)) throw new Error('npm-cli.js ausente junto ao Node');
const pasta = path.join(raiz, 'tmp/evidencias/refatoracao'); fs.mkdirSync(pasta, { recursive: true });
const inicio = new Date().toISOString(); const log = path.join(pasta, comando + '-' + inicio.replaceAll(/[:.]/g, '-') + '.log');
const registro = { comando: ['npm', 'run', comando], inicio, commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: raiz, encoding: 'utf8' }).trim(), log };
const fd = fs.openSync(log, 'wx');
console.log('Verificação em execução; log: ' + log);
const filho = spawn(process.execPath, [npm, 'run', comando], { cwd: raiz, env: process.env, stdio: ['ignore', fd, fd], windowsHide: true });
filho.once('error', erro => { registro.erro = erro.message; });
filho.once('close', (codigo, sinal) => {
  fs.closeSync(fd); Object.assign(registro, { codigo, sinal, termino: new Date().toISOString(), duracaoMs: Date.now() - Date.parse(inicio) });
  fs.writeFileSync(path.join(pasta, comando + '.json'), JSON.stringify(registro, null, 2));
  console.log(JSON.stringify(registro, null, 2)); process.exitCode = codigo ?? 1;
});
