/** Seleciona testes catalogados; não compila, não autoriza migração e preserva o hook em memória. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const raiz = fileURLToPath(new URL('../../', import.meta.url));
export function arquivosDeTeste(base = raiz, pasta = 'testes') {
  return fs.readdirSync(path.join(base, pasta), { withFileTypes: true }).flatMap(e => {
    const arquivo = pasta + '/' + e.name;
    if (e.isSymbolicLink()) throw new Error('TEST_LINK_REJECTED: ' + arquivo);
    return e.isDirectory() ? arquivosDeTeste(base, arquivo) : e.name.endsWith('.test.mjs') ? [arquivo] : [];
  }).sort();
}
export function validarCatalogo(catalogo, existentes) {
  if (catalogo.schemaVersion !== 1 || !Array.isArray(catalogo.testes)) throw new Error('TEST_CATALOG_INVALID');
  const caminhos = catalogo.testes.map(t => t.arquivo).sort();
  if (new Set(caminhos).size !== caminhos.length || JSON.stringify(caminhos) !== JSON.stringify([...existentes].sort())) throw new Error('TEST_CATALOG_DIVERGENT: arquivos ausentes, repetidos ou não catalogados');
  for (const t of catalogo.testes) {
    if (!['ui','ipc','mcp','regra','persistencia','integracao','estrutura'].includes(t.camada) || !Array.isArray(t.natureza) || !t.natureza.length || !t.natureza.every(n => ['unidade','contrato','smoke','e2e','regressao','seguranca','migracao','acessibilidade','visual'].includes(n)) || !/^[a-z0-9-]+$/.test(t.funcionalidade) || !t.motivo || !Array.isArray(t.evidencias) || !t.evidencias.length || typeof t.perfilReal !== 'boolean' || !/^testes\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.test\.mjs$/.test(t.arquivo)) throw new Error('TEST_CATALOG_INVALID: ' + t.arquivo);
  }
  return catalogo;
}
export function argumentos(args) {
  const filtros = {}; let listar = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--listar') { listar = true; continue; }
    if (!['--camada','--natureza','--funcionalidade'].includes(arg) || !args[i + 1] || args[i + 1].startsWith('--') || filtros[arg.slice(2)]) throw new Error('TEST_ARGUMENT_INVALID: ' + arg);
    filtros[arg.slice(2)] = args[++i];
  }
  return { filtros, listar };
}
export function selecionar(catalogo, filtros) {
  for (const [chave, valor] of Object.entries(filtros)) if (!catalogo.testes.some(t => chave === 'natureza' ? t.natureza.includes(valor) : t[chave] === valor)) throw new Error('TEST_FILTER_UNKNOWN: ' + chave + '=' + valor);
  return catalogo.testes.filter(t => Object.entries(filtros).every(([k,v]) => k === 'natureza' ? t.natureza.includes(v) : t[k] === v));
}
export function planoDeExecucao(selecao, env = process.env) {
  if (Object.entries(env).some(([k,v]) => (k === 'PRUMO_APP_EXE' || k.startsWith('PRUMO_MIGRACAO')) && v)) throw new Error('TEST_REAL_PROFILE_BLOCKED: remova PRUMO_APP_EXE e flags PRUMO_MIGRACAO');
  if (!selecao.length) throw new Error('TEST_SELECTION_EMPTY');
  if (selecao.some(t => t.perfilReal)) throw new Error('TEST_REAL_PROFILE_BLOCKED: migração pertence ao workflow isolado de instalação');
  return ['--require', './testes/conhecimento-hook.cjs', '--experimental-test-module-mocks', '--test', '--test-concurrency=1', ...selecao.map(t => t.arquivo)];
}
export function executar(args = process.argv.slice(2)) {
  const { filtros, listar } = argumentos(args);
  const catalogo = validarCatalogo(JSON.parse(fs.readFileSync(path.join(raiz, 'testes/catalogo.json'), 'utf8')), arquivosDeTeste());
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
