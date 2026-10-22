/** Seleciona testes pelo caminho testes/<natureza>/<camada>/<modulo>/; não compila, recusa o perfil instalado e preserva o hook em memória. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const raiz = fileURLToPath(new URL('../../', import.meta.url));
export const naturezas = ['unitario'];
export const camadas = ['backend', 'frontend'];
/** Simuladores necessários são versionados em testes/unitario/utilitarios; não exigem outro repositório. */
export function arquivosDeTeste(base = raiz, pasta = 'testes') {
  return fs.readdirSync(path.join(base, pasta), { withFileTypes: true }).flatMap(e => {
    const arquivo = pasta + '/' + e.name;
    if (e.isSymbolicLink()) throw new Error('TEST_LINK_REJECTED: ' + arquivo);
    return e.isDirectory() ? arquivosDeTeste(base, arquivo) : e.name.endsWith('.test.mjs') ? [arquivo] : [];
  }).sort();
}
/** Natureza, camada e módulo vêm só do caminho. */
export function descrever(arquivo) {
  const [pasta, natureza, camada, modulo, ...resto] = arquivo.split('/');
  if (pasta !== 'testes' || resto.length !== 1 || !naturezas.includes(natureza) || !camadas.includes(camada) || !/^[a-z-]+$/.test(modulo)) throw new Error('TEST_PATH_INVALID: use testes/<natureza>/<camada>/<modulo>/arquivo.test.mjs — ' + arquivo);
  return { arquivo, natureza, camada, modulo };
}
export function catalogar(existentes) { return existentes.map(descrever); }
export function argumentos(args) {
  const filtros = {}; let listar = false; let isolado = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--listar') { if (listar) throw new Error('TEST_ARGUMENT_INVALID: --listar'); listar = true; continue; }
    if (arg === '--isolado') { if (isolado) throw new Error('TEST_ARGUMENT_INVALID: --isolado'); isolado = true; continue; }
    if (!['--natureza', '--camada', '--modulo'].includes(arg) || !args[i + 1] || args[i + 1].startsWith('--') || filtros[arg.slice(2)]) throw new Error('TEST_ARGUMENT_INVALID: ' + arg);
    filtros[arg.slice(2)] = args[++i];
  }
  return { filtros, listar, isolado };
}
export function selecionar(catalogo, filtros) {
  for (const [chave, valor] of Object.entries(filtros)) if (!catalogo.some(t => t[chave] === valor)) throw new Error('TEST_FILTER_UNKNOWN: ' + chave + '=' + valor);
  return catalogo.filter(t => Object.entries(filtros).every(([k, v]) => t[k] === v));
}
/** Modo isolado: arquivo que importa o helper Electron não entra; os demais continuam sujeitos ao bloqueador de efeitos em runtime. */
export function dividirPorIsolamento(catalogo, base = raiz) {
  const elegiveis = [], pendentes = [];
  for (const t of catalogo) {
    const fonte = fs.readFileSync(path.join(base, t.arquivo), 'utf8');
    if (/janela\.mjs|playwright-core|electron\.launch|desktop-entry\.cjs/.test(fonte)) {
      pendentes.push({ arquivo: t.arquivo, motivo: 'ELECTRON_NAO_AUTORIZADO' }); continue;
    }
    elegiveis.push(t);
  }
  return { elegiveis, pendentes };
}
export function planoDeExecucao(selecao, env = process.env, isolado = false) {
  if (Object.entries(env).some(([k, v]) => (k === 'PRUMO_APP_EXE' || k.startsWith('PRUMO_MIGRACAO')) && v)) throw new Error('TEST_REAL_PROFILE_BLOCKED: remova PRUMO_APP_EXE e flags PRUMO_MIGRACAO');
  if (isolado && env.PRUMO_DATA_DIR) throw new Error('TEST_DATA_PROFILE_BLOCKED: remova PRUMO_DATA_DIR externo');
  if (!selecao.length) throw new Error('TEST_SELECTION_EMPTY');
  return [...(isolado ? ['--require', './testes/unitario/utilitarios/bloquear-efeitos.cjs'] : []),
    '--require', './testes/unitario/utilitarios/conhecimento-hook.cjs', '--experimental-test-module-mocks', '--test', '--test-concurrency=1', ...selecao.map(t => t.arquivo)];
}
export async function executar(args = process.argv.slice(2)) {
  const { filtros, listar, isolado } = argumentos(args);
  const catalogo = catalogar(arquivosDeTeste());
  const encontrados = selecionar(catalogo, filtros);
  const { elegiveis: selecao, pendentes } = isolado ? dividirPorIsolamento(encontrados) : { elegiveis: encontrados, pendentes: [] };
  if (listar) { console.log(JSON.stringify(isolado ? { elegiveis: selecao, pendentes } : selecao, null, 2)); return 0; }
  if (isolado) console.log('CHECK_ISOLADO: ' + selecao.length + ' arquivos elegíveis; ' + pendentes.length + ' arquivos NOT_RUN (requerem Electron).');
  for (const p of pendentes) console.log('NOT_RUN|' + p.motivo + '|' + p.arquivo);
  const arquivosApoio = ['bloquear-efeitos.cjs', 'conhecimento-hook.cjs', 'conhecimento-substitutos.cjs', 'conhecimento-falso.mjs'];
  for (const nome of arquivosApoio) {
    if (!fs.existsSync(path.join(raiz, 'testes', 'unitario', 'utilitarios', nome))) {
      throw new Error('TEST_APOIO_AUSENTE: ' + nome);
    }
  }
  const argv = planoDeExecucao(selecao, process.env, isolado);
  const resultado = spawnSync(process.execPath, argv, {
    cwd: raiz, env: process.env, stdio: 'inherit', windowsHide: true
  });
  if (resultado.error) throw resultado.error;
  if (isolado) console.log('CHECK_ISOLADO_RESULTADO=' + (resultado.status === 0 ? 'PASS' : 'FAIL') + '; E2E_ELECTRON=NOT_RUN; ARQUIVOS_PENDENTES=' + pendentes.length);
  return resultado.status ?? 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await executar(); } catch (erro) { console.error(erro.message); process.exitCode = 1; }
}
