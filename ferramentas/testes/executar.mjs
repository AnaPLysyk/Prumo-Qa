/** Seleciona testes pelo caminho testes/<natureza>/<camada>/<modulo>/; não compila, não autoriza migração e preserva o hook em memória. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const raiz = fileURLToPath(new URL('../../', import.meta.url));
export const naturezas = ['unitario', 'smoke', 'regressao'];
export const camadas = ['backend', 'frontend'];
export function arquivosDeTeste(base = raiz, pasta = 'testes') {
  return fs.readdirSync(path.join(base, pasta), { withFileTypes: true }).flatMap(e => {
    const arquivo = pasta + '/' + e.name;
    if (e.isSymbolicLink()) throw new Error('TEST_LINK_REJECTED: ' + arquivo);
    return e.isDirectory() ? arquivosDeTeste(base, arquivo) : e.name.endsWith('.test.mjs') ? [arquivo] : [];
  }).sort();
}
/** Natureza, camada e módulo vêm só do caminho; migração roda no perfil instalado do CI e fica fora da suíte local. */
export function descrever(arquivo) {
  const [pasta, natureza, camada, modulo, ...resto] = arquivo.split('/');
  if (pasta !== 'testes' || resto.length !== 1 || !naturezas.includes(natureza) || !camadas.includes(camada) || !/^[a-z-]+$/.test(modulo)) throw new Error('TEST_PATH_INVALID: use testes/<natureza>/<camada>/<modulo>/arquivo.test.mjs — ' + arquivo);
  return { arquivo, natureza, camada, modulo, perfilReal: path.basename(arquivo).startsWith('migracao') };
}
export function catalogar(existentes) { return existentes.map(descrever); }
export function argumentos(args) {
  const filtros = {}; let listar = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--listar') { listar = true; continue; }
    if (!['--natureza', '--camada', '--modulo'].includes(arg) || !args[i + 1] || args[i + 1].startsWith('--') || filtros[arg.slice(2)]) throw new Error('TEST_ARGUMENT_INVALID: ' + arg);
    filtros[arg.slice(2)] = args[++i];
  }
  return { filtros, listar };
}
export function selecionar(catalogo, filtros) {
  for (const [chave, valor] of Object.entries(filtros)) if (!catalogo.some(t => t[chave] === valor)) throw new Error('TEST_FILTER_UNKNOWN: ' + chave + '=' + valor);
  return catalogo.filter(t => Object.entries(filtros).every(([k, v]) => t[k] === v));
}
export function planoDeExecucao(selecao, env = process.env) {
  if (Object.entries(env).some(([k, v]) => (k === 'PRUMO_APP_EXE' || k.startsWith('PRUMO_MIGRACAO')) && v)) throw new Error('TEST_REAL_PROFILE_BLOCKED: remova PRUMO_APP_EXE e flags PRUMO_MIGRACAO');
  if (!selecao.length) throw new Error('TEST_SELECTION_EMPTY');
  if (selecao.some(t => t.perfilReal)) throw new Error('TEST_REAL_PROFILE_BLOCKED: migração pertence ao workflow isolado de instalação');
  return ['--require', './testes/apoio/conhecimento-hook.cjs', '--experimental-test-module-mocks', '--test', '--test-concurrency=1', ...selecao.map(t => t.arquivo)];
}
export function executar(args = process.argv.slice(2)) {
  const { filtros, listar } = argumentos(args);
  const catalogo = catalogar(arquivosDeTeste());
  const encontrados = selecionar(catalogo, filtros);
  const selecao = !listar && !Object.keys(filtros).length ? encontrados.filter(t => !t.perfilReal) : encontrados;
  if (listar) { console.log(JSON.stringify(selecao, null, 2)); return 0; }
  const argv = planoDeExecucao(selecao);
  const resultado = spawnSync(process.execPath, argv, { cwd: raiz, env: process.env, stdio: 'inherit', windowsHide: true });
  if (resultado.error) throw resultado.error;
  return resultado.status ?? 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = executar(); } catch (erro) { console.error(erro.message); process.exitCode = 1; }
}
