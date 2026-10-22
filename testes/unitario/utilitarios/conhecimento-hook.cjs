/** Substitui persistência dos agentes por memória somente durante os testes unitários. */
const { registerHooks } = require('node:module');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const requireHook = '--require ' + JSON.stringify(__filename);
if (!(process.env.NODE_OPTIONS ?? '').includes(__filename)) {
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, requireHook].filter(Boolean).join(' ');
}
const memoriaUrl = pathToFileURL(path.join(__dirname, 'conhecimento-falso.mjs')).href;
const substitutos = require('./conhecimento-substitutos.cjs');

registerHooks({
  load(url, context, nextLoad) {
    const modulo = url.split('/dist/')[1];
    const membros = modulo && substitutos[modulo];
    if (!membros) return nextLoad(url, context);
    const exports = Object.entries(membros)
      .map(([exportado, nome]) => 'export const ' + exportado + ' = memoria.' + nome + ';')
      .join('\n');
    return {
      format: 'module',
      shortCircuit: true,
      source: 'import { memoria } from ' + JSON.stringify(memoriaUrl) + ';\n' + exports + '\n'
    };
  }
});
