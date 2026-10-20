/** Confere se um comando do contrato é permitido: só "npm run <script>" ou "node <arquivo local>", sem variáveis secretas. */
import { ErroQa } from '../erros.js';
import { validarRelativo } from '../seguranca/validarRelativo.js';
import { Comando, Manifesto } from '../tipos/projeto.js';

export function validarComando(c: Comando, m: Manifesto) {
  validarRelativo(c.cwd);
  if (c.executable === 'npm' && !(c.args.length === 2 && c.args[0] === 'run' && /^[\w:-]+$/.test(c.args[1]!)))
    throw new ErroQa('COMMAND_FORBIDDEN', 'npm permite apenas run <script> sem parâmetros externos.');
  if (c.executable === 'node') {
    const args = c.args[0] === '--test' ? c.args.slice(1) : c.args;
    if (!args.length || args.some(v => v.startsWith('-') || !/\.(?:[cm]?js|test\.[cm]?js)$/.test(v)))
      throw new ErroQa('COMMAND_FORBIDDEN', 'node permite arquivos JavaScript locais; eval, loaders e flags arbitrárias são proibidos.');
    args.forEach(validarRelativo);
  }
  for (const n of [...Object.keys(c.env), ...c.requiredEnv, ...m.execution.envAllowlist]) {
    if (/secret|token|password|passwd|credential|private|node_options|node_test_context|path|home|appdata|comspec|npm_config/i.test(n))
      throw new ErroQa('ENV_FORBIDDEN', 'Variável sensível ou capaz de alterar o runtime.');
  }
  if (Object.keys(c.env).some(n => !m.execution.envAllowlist.includes(n)) || c.requiredEnv.some(n => !m.execution.envAllowlist.includes(n)))
    throw new ErroQa('ENV_FORBIDDEN', 'Variável fora da allowlist.');
}
